package handlers

import (
	"encoding/json"
	"fmt"
	"testing"

	"github.com/chat-note/backend/internal/config"
	"github.com/chat-note/backend/internal/crypto"
	"github.com/chat-note/backend/internal/database"
	"github.com/chat-note/backend/internal/middleware"
	"github.com/chat-note/backend/internal/models"
	"github.com/chat-note/backend/internal/repository"
	"github.com/chat-note/backend/internal/services"
	"github.com/chat-note/backend/internal/testutil"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupConversationTest(t *testing.T) (*gin.Engine, *config.Config, func()) {
	gin.SetMode(gin.TestMode)
	cleanup := testutil.SetupTestDB(t)

	cfg := testutil.TestConfig()
	jwtService := crypto.NewJWTService(cfg)
	aesCrypto, _ := crypto.NewAESCrypto(cfg.Encryption.Key)
	contextConfigService := services.NewContextConfigService(cfg)

	verificationCodeSvc := services.NewVerificationCodeService()
	emailSvc := services.NewEmailService(&config.SMTPConfig{}, &config.ResendConfig{})
	authHandler := NewAuthHandler(jwtService, verificationCodeSvc, emailSvc)
	convHandler := NewConversationHandler(cfg, aesCrypto, contextConfigService)

	router := gin.New()

	// Auth routes
	router.POST("/api/auth/register", authHandler.Register)
	router.POST("/api/auth/login", authHandler.Login)

	// Protected routes
	protected := router.Group("/api")
	protected.Use(middleware.Auth(jwtService))
	{
		protected.GET("/conversations", convHandler.List)
		protected.GET("/conversations/search", convHandler.Search)
		protected.POST("/conversations", convHandler.Create)
		protected.GET("/conversations/:id", convHandler.Get)
		protected.PUT("/conversations/:id", convHandler.Update)
		protected.DELETE("/conversations/:id", convHandler.Delete)
		protected.POST("/conversations/:id/mark-saved", convHandler.MarkSaved)
		protected.GET("/conversations/:id/messages", convHandler.GetMessages)
		protected.POST("/conversations/:id/messages", convHandler.SendMessage)
		protected.POST("/conversations/:id/messages/:messageId/regenerate", convHandler.Regenerate)
	}

	return router, cfg, cleanup
}

func TestConversationHandler_List(t *testing.T) {
	router, cfg, cleanup := setupConversationTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "conv_list@example.com", "hash")

	t.Run("should return empty list when no conversations", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "GET", "/api/conversations", nil, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].([]interface{})
		assert.Empty(t, data)
	})

	t.Run("should return conversations for user", func(t *testing.T) {
		testutil.CreateTestConversation(t, user.ID, "Conv 1")
		testutil.CreateTestConversation(t, user.ID, "Conv 2")

		w := testutil.MakeAuthenticatedRequest(router, "GET", "/api/conversations", nil, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].([]interface{})
		assert.GreaterOrEqual(t, len(data), 2)
	})
}

func TestConversationHandler_Create(t *testing.T) {
	router, cfg, cleanup := setupConversationTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "conv_create@example.com", "hash")

	t.Run("should create conversation successfully", func(t *testing.T) {
		body := `{"title": "New Conversation"}`
		w := testutil.MakeAuthenticatedRequest(router, "POST", "/api/conversations", body, user.ID, cfg)

		require.Equal(t, 201, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].(map[string]interface{})
		assert.Equal(t, "New Conversation", data["title"])
		assert.NotZero(t, data["id"])
	})

	t.Run("should create conversation with default title", func(t *testing.T) {
		body := `{}`
		w := testutil.MakeAuthenticatedRequest(router, "POST", "/api/conversations", body, user.ID, cfg)

		require.Equal(t, 201, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].(map[string]interface{})
		assert.Equal(t, "新对话", data["title"])
	})
}

func TestConversationHandler_Get(t *testing.T) {
	router, cfg, cleanup := setupConversationTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "conv_get@example.com", "hash")
	conv := testutil.CreateTestConversation(t, user.ID, "Get Test")

	t.Run("should return conversation by ID", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "GET", fmt.Sprintf("/api/conversations/%d", conv.ID), nil, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].(map[string]interface{})
		assert.Equal(t, "Get Test", data["title"])
	})

	t.Run("should return error for non-existent conversation", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "GET", "/api/conversations/99999", nil, user.ID, cfg)

		assert.Equal(t, 404, w.Code)
	})

	t.Run("should return error for other user's conversation", func(t *testing.T) {
		otherUser := testutil.CreateTestUser(t, "other_conv@example.com", "hash")
		otherConv := testutil.CreateTestConversation(t, otherUser.ID, "Other Conv")

		w := testutil.MakeAuthenticatedRequest(router, "GET", fmt.Sprintf("/api/conversations/%d", otherConv.ID), nil, user.ID, cfg)

		assert.Equal(t, 403, w.Code)
	})

	t.Run("should return error for invalid ID", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "GET", "/api/conversations/invalid", nil, user.ID, cfg)

		assert.Equal(t, 400, w.Code)
	})
}

func TestConversationHandler_Update(t *testing.T) {
	router, cfg, cleanup := setupConversationTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "conv_update@example.com", "hash")
	conv := testutil.CreateTestConversation(t, user.ID, "Original Title")

	t.Run("should update conversation title", func(t *testing.T) {
		body := `{"title": "Updated Title"}`
		w := testutil.MakeAuthenticatedRequest(router, "PUT", fmt.Sprintf("/api/conversations/%d", conv.ID), body, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].(map[string]interface{})
		assert.Equal(t, "Updated Title", data["title"])
	})

	t.Run("should return error for non-existent conversation", func(t *testing.T) {
		body := `{"title": "Test"}`
		w := testutil.MakeAuthenticatedRequest(router, "PUT", "/api/conversations/99999", body, user.ID, cfg)

		assert.Equal(t, 404, w.Code)
	})
}

func TestConversationHandler_Delete(t *testing.T) {
	router, cfg, cleanup := setupConversationTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "conv_delete@example.com", "hash")

	t.Run("should delete conversation", func(t *testing.T) {
		conv := testutil.CreateTestConversation(t, user.ID, "To Delete")

		w := testutil.MakeAuthenticatedRequest(router, "DELETE", fmt.Sprintf("/api/conversations/%d", conv.ID), nil, user.ID, cfg)

		require.Equal(t, 200, w.Code)
	})

	t.Run("should return error for invalid ID", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "DELETE", "/api/conversations/invalid", nil, user.ID, cfg)

		assert.Equal(t, 400, w.Code)
	})
}

func TestConversationHandler_MarkSaved(t *testing.T) {
	router, cfg, cleanup := setupConversationTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "conv_saved@example.com", "hash")
	conv := testutil.CreateTestConversation(t, user.ID, "To Save")

	t.Run("should mark conversation as saved", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "POST", fmt.Sprintf("/api/conversations/%d/mark-saved", conv.ID), nil, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].(map[string]interface{})
		assert.True(t, data["is_saved"].(bool))
	})

	t.Run("should return error for non-existent conversation", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "POST", "/api/conversations/99999/mark-saved", nil, user.ID, cfg)

		assert.Equal(t, 404, w.Code)
	})
}

func TestConversationHandler_GetMessages(t *testing.T) {
	router, cfg, cleanup := setupConversationTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "conv_msgs@example.com", "hash")
	conv := testutil.CreateTestConversation(t, user.ID, "Messages Test")

	// Create some messages
	testutil.CreateTestMessage(t, conv.ID, models.RoleUser, "Hello")
	testutil.CreateTestMessage(t, conv.ID, models.RoleAssistant, "Hi there!")

	t.Run("should return messages for conversation", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "GET", fmt.Sprintf("/api/conversations/%d/messages", conv.ID), nil, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].([]interface{})
		assert.GreaterOrEqual(t, len(data), 2)
	})

	t.Run("should return error for non-existent conversation", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "GET", "/api/conversations/99999/messages", nil, user.ID, cfg)

		assert.Equal(t, 404, w.Code)
	})
}

func TestConversationHandler_SendMessage(t *testing.T) {
	router, cfg, cleanup := setupConversationTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "conv_send@example.com", "hash")
	conv := testutil.CreateTestConversation(t, user.ID, "Send Test")

	t.Run("should send message and get mock response", func(t *testing.T) {
		body := `{"content": "Hello AI", "stream": false}`
		w := testutil.MakeAuthenticatedRequest(router, "POST", fmt.Sprintf("/api/conversations/%d/messages", conv.ID), body, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].(map[string]interface{})
		assert.NotEmpty(t, data["content"])
	})

	t.Run("should return error when content is missing", func(t *testing.T) {
		body := `{}`
		w := testutil.MakeAuthenticatedRequest(router, "POST", fmt.Sprintf("/api/conversations/%d/messages", conv.ID), body, user.ID, cfg)

		assert.Equal(t, 400, w.Code)
	})

	t.Run("should return error for non-existent conversation", func(t *testing.T) {
		body := `{"content": "Test"}`
		w := testutil.MakeAuthenticatedRequest(router, "POST", "/api/conversations/99999/messages", body, user.ID, cfg)

		assert.Equal(t, 404, w.Code)
	})
}

func TestConversationHandler_Regenerate(t *testing.T) {
	router, cfg, cleanup := setupConversationTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "conv_regen@example.com", "hash")
	conv := testutil.CreateTestConversation(t, user.ID, "Regen Test")

	// Create messages
	testutil.CreateTestMessage(t, conv.ID, models.RoleUser, "Hello")
	assistantMsg := testutil.CreateTestMessage(t, conv.ID, models.RoleAssistant, "Original response")

	t.Run("should return error for invalid conversation ID", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "POST",
			"/api/conversations/invalid/messages/1/regenerate",
			nil, user.ID, cfg)

		assert.Equal(t, 400, w.Code)
	})

	t.Run("should return error for non-existent conversation", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "POST",
			"/api/conversations/99999/messages/1/regenerate",
			nil, user.ID, cfg)

		assert.Equal(t, 404, w.Code)
	})

	t.Run("should return error when model is deleted", func(t *testing.T) {
		// Conv has no CurrentProviderModelID — model_deleted error
		w := testutil.MakeAuthenticatedRequest(router, "POST",
			fmt.Sprintf("/api/conversations/%d/messages/%d/regenerate", conv.ID, assistantMsg.ID),
			`{"stream": true}`, user.ID, cfg)

		assert.Equal(t, 400, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, "model_deleted", response["error"])
	})

		t.Run("should return error when regenerating non-last assistant message", func(t *testing.T) {
			// Create a conversation with multiple assistant messages
			multiConv := testutil.CreateTestConversation(t, user.ID, "Multi Assistant")
			testutil.CreateTestMessage(t, multiConv.ID, models.RoleUser, "Q1")
			firstAssistant := testutil.CreateTestMessage(t, multiConv.ID, models.RoleAssistant, "A1")
			testutil.CreateTestMessage(t, multiConv.ID, models.RoleUser, "Q2")
			testutil.CreateTestMessage(t, multiConv.ID, models.RoleAssistant, "A2") // last assistant

			// Try to regenerate the first (non-last) assistant message
			w := testutil.MakeAuthenticatedRequest(router, "POST",
				fmt.Sprintf("/api/conversations/%d/messages/%d/regenerate", multiConv.ID, firstAssistant.ID),
				`{"stream": true}`, user.ID, cfg)

			assert.Equal(t, 400, w.Code)
			var response map[string]interface{}
			json.Unmarshal(w.Body.Bytes(), &response)
			assert.Equal(t, "not_last_message", response["error"])
		})

	t.Run("should clear message_requests FK and delete assistant message", func(t *testing.T) {
		// Create a fresh conversation with a provider model for this test
		provider := testutil.CreateTestProvider(t, user.ID, "Regen FK Provider", models.ProviderOpenAI)
		providerModel := testutil.CreateTestProviderModel(t, provider.ID, "regen-fk-model", "Regen FK Model")

		fkConv := &models.Conversation{
			UserID:                 user.ID,
			CurrentProviderModelID: &providerModel.ID,
			ModelID:                "regen-fk-model",
			Title:                  "FK Test Conv",
		}
		require.NoError(t, database.DB.Create(fkConv).Error)

		testutil.CreateTestMessage(t, fkConv.ID, models.RoleUser, "Hello FK test")
		fkAssistantMsg := testutil.CreateTestMessage(t, fkConv.ID, models.RoleAssistant, "Original FK response")

		// Create a message_request that references the assistant message
		reqRepo := repository.NewMessageRequestRepository()
		msgReq := &models.MessageRequest{
			ConversationID:     fkConv.ID,
			RequestID:          uuid.New().String(),
			AssistantMessageID: &fkAssistantMsg.ID,
			Status:             models.StatusCompleted,
		}
		_, err := reqRepo.CreateIfNotExists(msgReq)
		require.NoError(t, err)

		// Verify FK is set before regeneration
		found, err := reqRepo.FindByRequestIDWithMessages(msgReq.RequestID)
		require.NoError(t, err)
		require.NotNil(t, found.AssistantMessageID, "FK should be set before regeneration")

		// Call regenerate — the LLM call will fail (no real API key),
		// but the FK cleanup and message deletion should succeed before that
		_ = testutil.MakeAuthenticatedRequest(router, "POST",
			fmt.Sprintf("/api/conversations/%d/messages/%d/regenerate", fkConv.ID, fkAssistantMsg.ID),
			`{"stream": true}`, user.ID, cfg)

		// Verify the assistant_message_id was cleared in message_requests
		found2, err := reqRepo.FindByRequestIDWithMessages(msgReq.RequestID)
		require.NoError(t, err)
		assert.Nil(t, found2.AssistantMessageID, "assistant_message_id should have been cleared")

		// Verify the old message was deleted
		var deletedMsg models.Message
		err = database.DB.Where("id = ?", fkAssistantMsg.ID).First(&deletedMsg).Error
		assert.Error(t, err, "old assistant message should have been deleted")
	})
}

func TestConversationHandler_CreateWithModelID(t *testing.T) {
	router, cfg, cleanup := setupConversationTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "conv_model_id@example.com", "hash")
	provider := testutil.CreateTestProvider(t, user.ID, "Model ID Test Provider", models.ProviderOpenAI)
	providerModel := testutil.CreateTestProviderModel(t, provider.ID, "gpt-4o", "GPT-4o")

	t.Run("should create conversation with model_id snapshot", func(t *testing.T) {
		body := fmt.Sprintf(`{"title": "Model ID Test", "provider_model_id": "%s"}`, providerModel.ID.String())
		w := testutil.MakeAuthenticatedRequest(router, "POST", "/api/conversations", body, user.ID, cfg)

		require.Equal(t, 201, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].(map[string]interface{})

		// Verify model_id snapshot is saved
		assert.Equal(t, "gpt-4o", data["model_id"])
		assert.NotNil(t, data["provider_model_id"])
	})

	t.Run("should create conversation with explicit model_id", func(t *testing.T) {
		body := fmt.Sprintf(`{"title": "Explicit Model ID", "provider_model_id": "%s", "model_id": "custom-model-id"}`, providerModel.ID.String())
		w := testutil.MakeAuthenticatedRequest(router, "POST", "/api/conversations", body, user.ID, cfg)

		require.Equal(t, 201, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].(map[string]interface{})

		// Verify explicit model_id is used
		assert.Equal(t, "custom-model-id", data["model_id"])
	})
}

func TestConversationHandler_SendMessage_DeletedModel(t *testing.T) {
	router, cfg, cleanup := setupConversationTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "conv_deleted_model@example.com", "hash")

	t.Run("should return error when model is deleted (provider_model_id is null)", func(t *testing.T) {
		// Create a conversation with null provider_model_id but with model_id snapshot
		conv := &models.Conversation{
			UserID:                 user.ID,
			CurrentProviderModelID: nil, // Model has been deleted
			ModelID:                "gpt-4o-deleted",
			Title:                  "Deleted Model Conversation",
		}
		require.NoError(t, database.DB.Create(conv).Error)

		body := `{"content": "Hello", "stream": false}`
		w := testutil.MakeAuthenticatedRequest(router, "POST",
			fmt.Sprintf("/api/conversations/%d/messages", conv.ID), body, user.ID, cfg)

		// Should return error about deleted model
		assert.Equal(t, 400, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, "model_deleted", response["error"])
		assert.Contains(t, response["message"], "gpt-4o-deleted")
	})

	t.Run("should work normally when model exists", func(t *testing.T) {
		provider := testutil.CreateTestProvider(t, user.ID, "Normal Provider", models.ProviderOpenAI)
		providerModel := testutil.CreateTestProviderModel(t, provider.ID, "gpt-4o-mini", "GPT-4o Mini")

		conv := &models.Conversation{
			UserID:                 user.ID,
			CurrentProviderModelID: &providerModel.ID,
			ModelID:                "gpt-4o-mini",
			Title:                  "Normal Conversation",
		}
		require.NoError(t, database.DB.Create(conv).Error)

		body := `{"content": "Hello", "stream": false}`
		w := testutil.MakeAuthenticatedRequest(router, "POST",
			fmt.Sprintf("/api/conversations/%d/messages", conv.ID), body, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].(map[string]interface{})
		assert.NotEmpty(t, data["content"])
	})
}

func TestConversationModelID_Snapshot(t *testing.T) {
	cleanup := testutil.SetupTestDB(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "snapshot@example.com", "hash")
	provider := testutil.CreateTestProvider(t, user.ID, "Snapshot Provider", models.ProviderOpenAI)
	providerModel := testutil.CreateTestProviderModel(t, provider.ID, "gpt-4-turbo", "GPT-4 Turbo")

	t.Run("model_id snapshot should be preserved after model deletion", func(t *testing.T) {
		// Create conversation with model
		conv := &models.Conversation{
			UserID:                 user.ID,
			CurrentProviderModelID: &providerModel.ID,
			ModelID:                "gpt-4-turbo",
			Title:                  "Snapshot Test",
		}
		require.NoError(t, database.DB.Create(conv).Error)

		// Verify initial state
		var initialConv models.Conversation
		database.DB.First(&initialConv, conv.ID)
		assert.NotNil(t, initialConv.CurrentProviderModelID)
		assert.Equal(t, "gpt-4-turbo", initialConv.ModelID)

		// Simulate model deletion by setting provider_model_id to NULL
		database.DB.Model(&models.Conversation{}).
			Where("id = ?", conv.ID).
			Update("provider_model_id", nil)

		// Verify model_id is preserved
		var afterDeletionConv models.Conversation
		database.DB.First(&afterDeletionConv, conv.ID)
		assert.Nil(t, afterDeletionConv.CurrentProviderModelID)
		assert.Equal(t, "gpt-4-turbo", afterDeletionConv.ModelID, "model_id snapshot should be preserved")
	})

	t.Run("conversation can be retrieved even after model deletion", func(t *testing.T) {
		// Create a new model and conversation
		modelID := uuid.New()
		model := &models.ProviderModel{
			ID:          modelID,
			ProviderID:  provider.ID,
			ModelID:     "temporary-model",
			DisplayName: "Temporary Model",
			Enabled:     true,
		}
		require.NoError(t, database.DB.Create(model).Error)

		conv := &models.Conversation{
			UserID:                 user.ID,
			CurrentProviderModelID: &modelID,
			ModelID:                "temporary-model",
			Title:                  "Temp Model Conv",
		}
		require.NoError(t, database.DB.Create(conv).Error)

		// Delete the model (hard delete)
		database.DB.Where("id = ?", modelID).Delete(&models.ProviderModel{})

		// Update conversation's provider_model_id to NULL (simulating Sync behavior)
		database.DB.Model(&models.Conversation{}).
			Where("provider_model_id = ?", modelID).
			Update("provider_model_id", nil)

		// Conversation should still be retrievable
		var retrievedConv models.Conversation
		result := database.DB.First(&retrievedConv, conv.ID)
		require.NoError(t, result.Error)
		assert.Equal(t, "temporary-model", retrievedConv.ModelID)
		assert.Nil(t, retrievedConv.CurrentProviderModelID)
	})
}

func TestConversationHandler_Search(t *testing.T) {
	router, cfg, cleanup := setupConversationTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "search@example.com", "hash")
	otherUser := testutil.CreateTestUser(t, "search_other@example.com", "hash")

	// Create conversations with different titles
	conv1 := testutil.CreateTestConversation(t, user.ID, "测试对话")
	conv2 := testutil.CreateTestConversation(t, user.ID, "普通对话")
	conv3 := testutil.CreateTestConversation(t, otherUser.ID, "其他用户的测试")

	// Add messages to conv1
	testutil.CreateTestMessage(t, conv1.ID, models.RoleUser, "这是一条测试消息内容")
	testutil.CreateTestMessage(t, conv1.ID, models.RoleAssistant, "这是助手的回复")

	// Add message to conv2
	testutil.CreateTestMessage(t, conv2.ID, models.RoleUser, "普通消息内容")

	t.Run("should return empty when query is empty", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "GET", "/api/conversations/search", nil, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].([]interface{})
		assert.Empty(t, data)
	})

	t.Run("should search by title keyword", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "GET", "/api/conversations/search?q=%E6%B5%8B%E8%AF%95", nil, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].([]interface{})
		assert.GreaterOrEqual(t, len(data), 1)

		// First result should be title match
		firstResult := data[0].(map[string]interface{})
		assert.Equal(t, "测试对话", firstResult["title"])
		assert.Equal(t, "title", firstResult["matched_in"])
	})

	t.Run("should search by content keyword", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "GET", "/api/conversations/search?q=%E6%B6%88%E6%81%AF%E5%86%85%E5%AE%B9", nil, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].([]interface{})
		assert.GreaterOrEqual(t, len(data), 1)
	})

	t.Run("should not return other users conversations", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "GET", "/api/conversations/search?q=%E6%B5%8B%E8%AF%95", nil, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].([]interface{})

		// Should not include conv3 (other user's conversation)
		for _, item := range data {
			result := item.(map[string]interface{})
			assert.NotEqual(t, conv3.ID, uint(result["id"].(float64)))
		}
	})

	t.Run("should return empty when no match", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "GET", "/api/conversations/search?q=nonexistent_keyword_xyz123", nil, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].([]interface{})
		assert.Empty(t, data)
	})

	t.Run("should respect limit parameter", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "GET", "/api/conversations/search?q=%E5%AF%B9%E8%AF%9D&limit=1", nil, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].([]interface{})
		assert.LessOrEqual(t, len(data), 1)
	})
}
