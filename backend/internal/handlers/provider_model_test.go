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
	"github.com/chat-note/backend/internal/services"
	"github.com/chat-note/backend/internal/testutil"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupProviderModelTest(t *testing.T) (*gin.Engine, *config.Config, func()) {
	gin.SetMode(gin.TestMode)
	cleanup := testutil.SetupTestDB(t)

	cfg := testutil.TestConfig()
	jwtService := crypto.NewJWTService(cfg)
	aesCrypto, _ := crypto.NewAESCrypto(cfg.Encryption.Key)

	verificationCodeSvc := services.NewVerificationCodeService()
	emailSvc := services.NewEmailService(&config.SMTPConfig{})
	authHandler := NewAuthHandler(jwtService, verificationCodeSvc, emailSvc)
	providerHandler := NewProviderHandler(aesCrypto)
	providerModelHandler := NewProviderModelHandler()

	router := gin.New()

	// Auth routes
	router.POST("/api/auth/register", authHandler.Register)
	router.POST("/api/auth/login", authHandler.Login)

	// Protected routes
	protected := router.Group("/api")
	protected.Use(middleware.Auth(jwtService))
	{
		protected.GET("/providers", providerHandler.List)
		protected.POST("/providers", providerHandler.Create)
		protected.GET("/providers/:id", providerHandler.Get)
		protected.PUT("/providers/:id", providerHandler.Update)
		protected.DELETE("/providers/:id", providerHandler.Delete)
		protected.GET("/providers/:id/available-models", providerHandler.GetAvailableModels)

		// Provider model routes
		protected.GET("/providers/:id/models", providerModelHandler.List)
		protected.POST("/providers/:id/models", providerModelHandler.Add)
		protected.PUT("/providers/:id/models/:modelId", providerModelHandler.Update)
		protected.DELETE("/providers/:id/models/:modelId", providerModelHandler.Delete)
		protected.POST("/providers/:id/models/batch", providerModelHandler.BatchAdd)
		protected.POST("/providers/:id/models/sync", providerModelHandler.Sync)
	}

	return router, cfg, cleanup
}

func createProviderWithModels(t *testing.T, userID uint, providerName string) *models.Provider {
	aesCrypto, _ := crypto.NewAESCrypto(testutil.TestConfig().Encryption.Key)
	encryptedKey, _ := aesCrypto.Encrypt("test-api-key")

	provider := &models.Provider{
		ID:              uuid.New(),
		UserID:          userID,
		Name:            providerName,
		Type:            models.ProviderOpenAI,
		APIBase:         "https://api.openai.com/v1",
		APIKeyEncrypted: encryptedKey,
	}
	require.NoError(t, database.DB.Create(provider).Error)

	// Add some initial models
	model1 := &models.ProviderModel{
		ID:          uuid.New(),
		ProviderID:  provider.ID,
		ModelID:     "gpt-4o",
		DisplayName: "GPT-4o",
		IsDefault:   true,
		Enabled:     true,
	}
	model2 := &models.ProviderModel{
		ID:          uuid.New(),
		ProviderID:  provider.ID,
		ModelID:     "gpt-4o-mini",
		DisplayName: "GPT-4o Mini",
		IsDefault:   false,
		Enabled:     true,
	}
	require.NoError(t, database.DB.Create(model1).Error)
	require.NoError(t, database.DB.Create(model2).Error)

	return provider
}

func TestProviderModelHandler_Sync(t *testing.T) {
	router, cfg, cleanup := setupProviderModelTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "sync_test@example.com", "hash")

	t.Run("should add new models successfully", func(t *testing.T) {
		provider := createProviderWithModels(t, user.ID, "Sync Add Test")

		body := `{
			"add": [
				{ "model_id": "gpt-4-turbo", "display_name": "GPT-4 Turbo" },
				{ "model_id": "o1-preview", "display_name": "O1 Preview" }
			]
		}`
		w := testutil.MakeAuthenticatedRequest(router, "POST",
			fmt.Sprintf("/api/providers/%s/models/sync", provider.ID), body, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, float64(2), response["added"])
		assert.Equal(t, float64(0), response["deleted"])
	})

	t.Run("should delete models successfully", func(t *testing.T) {
		provider := createProviderWithModels(t, user.ID, "Sync Delete Test")

		// Get existing model IDs
		var existingModels []models.ProviderModel
		database.DB.Where("provider_id = ?", provider.ID).Find(&existingModels)
		require.GreaterOrEqual(t, len(existingModels), 1)

		deleteID := existingModels[0].ID.String()
		body := fmt.Sprintf(`{
			"delete": ["%s"]
		}`, deleteID)
		w := testutil.MakeAuthenticatedRequest(router, "POST",
			fmt.Sprintf("/api/providers/%s/models/sync", provider.ID), body, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, float64(1), response["deleted"])
	})

	t.Run("should update default model successfully", func(t *testing.T) {
		provider := createProviderWithModels(t, user.ID, "Sync Default Test")

		// Get existing model IDs
		var existingModels []models.ProviderModel
		database.DB.Where("provider_id = ?", provider.ID).Find(&existingModels)
		require.GreaterOrEqual(t, len(existingModels), 2)

		// The second model should not be default initially
		newDefaultID := existingModels[1].ID.String()
		body := fmt.Sprintf(`{
			"default_model_id": "%s"
		}`, newDefaultID)
		w := testutil.MakeAuthenticatedRequest(router, "POST",
			fmt.Sprintf("/api/providers/%s/models/sync", provider.ID), body, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, float64(1), response["updated"])
	})

	t.Run("should handle mixed operations atomically", func(t *testing.T) {
		provider := createProviderWithModels(t, user.ID, "Sync Mixed Test")

		// Get existing model IDs
		var existingModels []models.ProviderModel
		database.DB.Where("provider_id = ?", provider.ID).Find(&existingModels)
		require.GreaterOrEqual(t, len(existingModels), 2)

		deleteID := existingModels[0].ID.String()
		newDefaultID := existingModels[1].ID.String()

		body := fmt.Sprintf(`{
			"add": [
				{ "model_id": "claude-3-opus", "display_name": "Claude 3 Opus" }
			],
			"delete": ["%s"],
			"default_model_id": "%s"
		}`, deleteID, newDefaultID)
		w := testutil.MakeAuthenticatedRequest(router, "POST",
			fmt.Sprintf("/api/providers/%s/models/sync", provider.ID), body, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, float64(1), response["added"])
		assert.Equal(t, float64(1), response["deleted"])
		assert.Equal(t, float64(1), response["updated"])
	})

	t.Run("should return error for non-existent provider", func(t *testing.T) {
		body := `{ "add": [{ "model_id": "test" }] }`
		w := testutil.MakeAuthenticatedRequest(router, "POST",
			fmt.Sprintf("/api/providers/%s/models/sync", uuid.New()), body, user.ID, cfg)

		assert.Equal(t, 404, w.Code)
	})

	t.Run("should return error for invalid provider UUID", func(t *testing.T) {
		body := `{ "add": [{ "model_id": "test" }] }`
		w := testutil.MakeAuthenticatedRequest(router, "POST",
			"/api/providers/invalid-uuid/models/sync", body, user.ID, cfg)

		assert.Equal(t, 400, w.Code)
	})

	t.Run("should return error for invalid delete ID", func(t *testing.T) {
		provider := createProviderWithModels(t, user.ID, "Sync Invalid Delete Test")

		body := `{ "delete": ["invalid-uuid"] }`
		w := testutil.MakeAuthenticatedRequest(router, "POST",
			fmt.Sprintf("/api/providers/%s/models/sync", provider.ID), body, user.ID, cfg)

		assert.Equal(t, 400, w.Code)
	})

	t.Run("should return empty sync result when no operations", func(t *testing.T) {
		provider := createProviderWithModels(t, user.ID, "Sync Empty Test")

		body := `{}`
		w := testutil.MakeAuthenticatedRequest(router, "POST",
			fmt.Sprintf("/api/providers/%s/models/sync", provider.ID), body, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, float64(0), response["added"])
		assert.Equal(t, float64(0), response["deleted"])
		assert.Equal(t, float64(0), response["updated"])
	})

	t.Run("should not allow sync for other user's provider", func(t *testing.T) {
		otherUser := testutil.CreateTestUser(t, "other_sync@example.com", "hash")
		provider := createProviderWithModels(t, otherUser.ID, "Other User Provider")

		body := `{ "add": [{ "model_id": "test" }] }`
		w := testutil.MakeAuthenticatedRequest(router, "POST",
			fmt.Sprintf("/api/providers/%s/models/sync", provider.ID), body, user.ID, cfg)

		assert.Equal(t, 404, w.Code)
	})
}

func TestProviderModelHandler_List(t *testing.T) {
	router, cfg, cleanup := setupProviderModelTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "model_list@example.com", "hash")

	t.Run("should return models for provider", func(t *testing.T) {
		provider := createProviderWithModels(t, user.ID, "List Test Provider")

		w := testutil.MakeAuthenticatedRequest(router, "GET",
			fmt.Sprintf("/api/providers/%s/models", provider.ID), nil, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		models := response["models"].([]interface{})
		assert.GreaterOrEqual(t, len(models), 2)
	})

	t.Run("should return empty list for provider without models", func(t *testing.T) {
		provider := testutil.CreateTestProvider(t, user.ID, "Empty Provider", models.ProviderOpenAI)

		w := testutil.MakeAuthenticatedRequest(router, "GET",
			fmt.Sprintf("/api/providers/%s/models", provider.ID), nil, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		models := response["models"].([]interface{})
		assert.Empty(t, models)
	})
}

func TestProviderModelHandler_Add(t *testing.T) {
	router, cfg, cleanup := setupProviderModelTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "model_add@example.com", "hash")
	provider := testutil.CreateTestProvider(t, user.ID, "Add Test Provider", models.ProviderOpenAI)

	t.Run("should add model successfully", func(t *testing.T) {
		body := `{
			"model_id": "gpt-4-turbo",
			"display_name": "GPT-4 Turbo",
			"is_default": false
		}`
		w := testutil.MakeAuthenticatedRequest(router, "POST",
			fmt.Sprintf("/api/providers/%s/models", provider.ID), body, user.ID, cfg)

		require.Equal(t, 201, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		model := response["model"].(map[string]interface{})
		assert.Equal(t, "gpt-4-turbo", model["model_id"])
	})

	t.Run("should return error for missing model_id", func(t *testing.T) {
		body := `{ "display_name": "Test" }`
		w := testutil.MakeAuthenticatedRequest(router, "POST",
			fmt.Sprintf("/api/providers/%s/models", provider.ID), body, user.ID, cfg)

		assert.Equal(t, 400, w.Code)
	})
}

func TestProviderModelHandler_BatchAdd(t *testing.T) {
	router, cfg, cleanup := setupProviderModelTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "model_batch@example.com", "hash")
	provider := testutil.CreateTestProvider(t, user.ID, "Batch Add Provider", models.ProviderOpenAI)

	t.Run("should batch add models successfully", func(t *testing.T) {
		body := `{
			"models": [
				{ "model_id": "gpt-4", "display_name": "GPT-4" },
				{ "model_id": "gpt-3.5-turbo", "display_name": "GPT-3.5 Turbo" }
			],
			"default_model_id": "gpt-4"
		}`
		w := testutil.MakeAuthenticatedRequest(router, "POST",
			fmt.Sprintf("/api/providers/%s/models/batch", provider.ID), body, user.ID, cfg)

		require.Equal(t, 201, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		models := response["models"].([]interface{})
		assert.GreaterOrEqual(t, len(models), 2)
	})
}

func TestProviderModelHandler_Sync_EnableDisable(t *testing.T) {
	router, cfg, cleanup := setupProviderModelTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "enable_disable@example.com", "hash")

	t.Run("should enable models successfully", func(t *testing.T) {
		provider := createProviderWithModels(t, user.ID, "Enable Test Provider")

		// Get existing models and disable one first
		var existingModels []models.ProviderModel
		database.DB.Where("provider_id = ?", provider.ID).Find(&existingModels)
		require.GreaterOrEqual(t, len(existingModels), 1)

		modelToEnable := existingModels[0]
		// First disable it
		database.DB.Model(&modelToEnable).Update("enabled", false)

		// Now enable it via sync API
		body := fmt.Sprintf(`{
			"enable": ["%s"]
		}`, modelToEnable.ID.String())
		w := testutil.MakeAuthenticatedRequest(router, "POST",
			fmt.Sprintf("/api/providers/%s/models/sync", provider.ID), body, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, float64(1), response["enabled"])
	})

	t.Run("should disable models successfully", func(t *testing.T) {
		provider := createProviderWithModels(t, user.ID, "Disable Test Provider")

		// Get existing models
		var existingModels []models.ProviderModel
		database.DB.Where("provider_id = ?", provider.ID).Find(&existingModels)
		require.GreaterOrEqual(t, len(existingModels), 1)

		modelToDisable := existingModels[0]
		body := fmt.Sprintf(`{
			"disable": ["%s"]
		}`, modelToDisable.ID.String())
		w := testutil.MakeAuthenticatedRequest(router, "POST",
			fmt.Sprintf("/api/providers/%s/models/sync", provider.ID), body, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, float64(1), response["disabled"])
	})

	t.Run("should handle combined enable and disable operations", func(t *testing.T) {
		provider := createProviderWithModels(t, user.ID, "Combined Enable Disable Test")

		// Get existing models
		var existingModels []models.ProviderModel
		database.DB.Where("provider_id = ?", provider.ID).Find(&existingModels)
		require.GreaterOrEqual(t, len(existingModels), 2)

		// Disable first model, enable second model
		modelToDisable := existingModels[0]
		modelToEnable := existingModels[1]

		// First, set the second model as disabled
		database.DB.Model(&modelToEnable).Update("enabled", false)

		body := fmt.Sprintf(`{
			"enable": ["%s"],
			"disable": ["%s"]
		}`, modelToEnable.ID.String(), modelToDisable.ID.String())
		w := testutil.MakeAuthenticatedRequest(router, "POST",
			fmt.Sprintf("/api/providers/%s/models/sync", provider.ID), body, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, float64(1), response["enabled"])
		assert.Equal(t, float64(1), response["disabled"])
	})

	t.Run("should return error when model is in both enable and disable arrays", func(t *testing.T) {
		provider := createProviderWithModels(t, user.ID, "Validation Test Provider")

		// Get existing model
		var existingModels []models.ProviderModel
		database.DB.Where("provider_id = ?", provider.ID).Find(&existingModels)
		require.GreaterOrEqual(t, len(existingModels), 1)

		modelID := existingModels[0].ID.String()
		body := fmt.Sprintf(`{
			"enable": ["%s"],
			"disable": ["%s"]
		}`, modelID, modelID)
		w := testutil.MakeAuthenticatedRequest(router, "POST",
			fmt.Sprintf("/api/providers/%s/models/sync", provider.ID), body, user.ID, cfg)

		assert.Equal(t, 400, w.Code)
	})

	t.Run("should hard delete model and preserve model_id in conversations", func(t *testing.T) {
		provider := createProviderWithModels(t, user.ID, "Hard Delete Test Provider")

		// Get existing model
		var existingModels []models.ProviderModel
		database.DB.Where("provider_id = ?", provider.ID).Find(&existingModels)
		require.GreaterOrEqual(t, len(existingModels), 1)

		modelToDelete := existingModels[0]

		// Create a conversation with this model
		conv := &models.Conversation{
			UserID:          user.ID,
			CurrentProviderModelID: &modelToDelete.ID,
			ModelID:         modelToDelete.ModelID,
			Title:           "Test Conversation",
		}
		require.NoError(t, database.DB.Create(conv).Error)

		// Delete the model
		body := fmt.Sprintf(`{
			"delete": ["%s"]
		}`, modelToDelete.ID.String())
		w := testutil.MakeAuthenticatedRequest(router, "POST",
			fmt.Sprintf("/api/providers/%s/models/sync", provider.ID), body, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, float64(1), response["deleted"])

		// Verify conversation still exists with model_id preserved but provider_model_id is null
		var updatedConv models.Conversation
		database.DB.First(&updatedConv, conv.ID)
		assert.Nil(t, updatedConv.CurrentProviderModelID)
		assert.Equal(t, modelToDelete.ModelID, updatedConv.ModelID)
	})
}
