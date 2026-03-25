package repository

import (
	"testing"

	"github.com/chat-note/backend/internal/database"
	"github.com/chat-note/backend/internal/models"
	"github.com/chat-note/backend/internal/testutil"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestConversationRepository(t *testing.T) {
	cleanup := testutil.SetupTestDB(t)
	defer cleanup()

	convRepo := NewConversationRepository()
	msgRepo := NewMessageRepository()
	userRepo := NewUserRepository()

	// Create test user
	user := &models.User{
		Email:        "conv_test@example.com",
		PasswordHash: "hash",
	}
	require.NoError(t, userRepo.Create(user))

	t.Run("Create", func(t *testing.T) {
		conv := &models.Conversation{
			UserID: user.ID,
			Title:  "Test Conversation",
		}

		err := convRepo.Create(conv)

		require.NoError(t, err)
		assert.Greater(t, conv.ID, uint(0))
	})

	t.Run("Create_WithModelID", func(t *testing.T) {
		modelID := uuid.New()
		conv := &models.Conversation{
			UserID:          user.ID,
			Title:           "Conversation with Model",
			CurrentProviderModelID: &modelID,
		}

		err := convRepo.Create(conv)

		require.NoError(t, err)
		assert.Equal(t, modelID, *conv.CurrentProviderModelID)
	})

	t.Run("Create_WithModelIDSnapshot", func(t *testing.T) {
		modelID := uuid.New()
		conv := &models.Conversation{
			UserID:          user.ID,
			Title:           "Conversation with Model Snapshot",
			CurrentProviderModelID: &modelID,
			ModelID:         "gpt-4o",
		}

		err := convRepo.Create(conv)

		require.NoError(t, err)
		assert.Equal(t, modelID, *conv.CurrentProviderModelID)
		assert.Equal(t, "gpt-4o", conv.ModelID)
	})

	t.Run("FindByUserID", func(t *testing.T) {
		// Create multiple conversations
		for i := 0; i < 3; i++ {
			conv := &models.Conversation{
				UserID: user.ID,
				Title:  "Conversation",
			}
			require.NoError(t, convRepo.Create(conv))
		}

		conversations, err := convRepo.FindByUserID(user.ID)

		require.NoError(t, err)
		assert.GreaterOrEqual(t, len(conversations), 3)
	})

	t.Run("FindByIDAndUserID", func(t *testing.T) {
		conv := &models.Conversation{
			UserID: user.ID,
			Title:  "Find By ID Test",
		}
		require.NoError(t, convRepo.Create(conv))

		found, err := convRepo.FindByIDAndUserID(conv.ID, user.ID)

		require.NoError(t, err)
		require.NotNil(t, found)
		assert.Equal(t, conv.ID, found.ID)
		assert.Equal(t, "Find By ID Test", found.Title)
	})

	t.Run("FindByIDAndUserID_NotExists", func(t *testing.T) {
		found, err := convRepo.FindByIDAndUserID(999999, user.ID)

		assert.Error(t, err)
		assert.Nil(t, found)
	})

	t.Run("FindByIDAndUserID", func(t *testing.T) {
		conv := &models.Conversation{
			UserID: user.ID,
			Title:  "Owner Test",
		}
		require.NoError(t, convRepo.Create(conv))

		// Find with correct user
		found, err := convRepo.FindByIDAndUserID(conv.ID, user.ID)
		require.NoError(t, err)
		assert.NotNil(t, found)

		// Find with wrong user
		found, err = convRepo.FindByIDAndUserID(conv.ID, 999999)
		assert.Error(t, err)
		assert.Nil(t, found)
	})

	t.Run("FindByIDWithMessagesAndUserID", func(t *testing.T) {
		// Create conversation with messages
		conv := &models.Conversation{
			UserID: user.ID,
			Title:  "With Messages",
		}
		require.NoError(t, convRepo.Create(conv))

		// Add messages
		msg1 := &models.Message{
			ConversationID: conv.ID,
			Role:           models.RoleUser,
			Content:        "Hello",
		}
		msg2 := &models.Message{
			ConversationID: conv.ID,
			Role:           models.RoleAssistant,
			Content:        "Hi there!",
		}
		require.NoError(t, msgRepo.Create(msg1))
		require.NoError(t, msgRepo.Create(msg2))

		found, err := convRepo.FindByIDWithMessagesAndUserID(conv.ID, user.ID)

		require.NoError(t, err)
		require.NotNil(t, found)
		assert.Len(t, found.Messages, 2)
	})

	t.Run("Update", func(t *testing.T) {
		conv := &models.Conversation{
			UserID: user.ID,
			Title:  "Original Title",
		}
		require.NoError(t, convRepo.Create(conv))

		conv.Title = "Updated Title"
		err := convRepo.Update(conv)

		require.NoError(t, err)

		found, _ := convRepo.FindByIDAndUserID(conv.ID, user.ID)
		assert.Equal(t, "Updated Title", found.Title)
	})

	t.Run("Delete", func(t *testing.T) {
		conv := &models.Conversation{
			UserID: user.ID,
			Title:  "To Delete",
		}
		require.NoError(t, convRepo.Create(conv))

		err := convRepo.Delete(conv.ID, user.ID)

		require.NoError(t, err)

		found, err := convRepo.FindByIDAndUserID(conv.ID, user.ID)
		assert.Error(t, err)
		assert.Nil(t, found)
	})

	t.Run("Delete_WrongUser", func(t *testing.T) {
		conv := &models.Conversation{
			UserID: user.ID,
			Title:  "Wrong User Delete",
		}
		require.NoError(t, convRepo.Create(conv))

		// Try to delete with wrong user
		err := convRepo.Delete(conv.ID, 999999)
		// Should not error, but not delete either
		require.NoError(t, err)

		// Should still exist
		found, _ := convRepo.FindByIDAndUserID(conv.ID, user.ID)
		require.NotNil(t, found)
	})

	t.Run("Delete_WithMessageRequests", func(t *testing.T) {
		// Create a conversation
		conv := &models.Conversation{
			UserID: user.ID,
			Title:  "Conversation with Message Requests",
		}
		require.NoError(t, convRepo.Create(conv))

		// Create message requests for the conversation
		reqRepo := NewMessageRequestRepository()
		for i := 0; i < 3; i++ {
			req := &models.MessageRequest{
				ConversationID: conv.ID,
				RequestID:      uuid.New().String(),
				Status:         models.StatusCompleted,
			}
			_, err := reqRepo.CreateIfNotExists(req)
			require.NoError(t, err)
		}

		// Verify message requests exist
		var count int64
		database.DB.Model(&models.MessageRequest{}).Where("conversation_id = ?", conv.ID).Count(&count)
		require.NoError(t, database.DB.Error)
		require.Equal(t, int64(3), count)

		// Delete the conversation
		err := convRepo.Delete(conv.ID, user.ID)
		require.NoError(t, err)

		// Verify conversation is deleted
		found, err := convRepo.FindByIDAndUserID(conv.ID, user.ID)
		require.Error(t, err)
		require.Nil(t, found)

		// Verify message requests are also deleted
		var newCount int64
		database.DB.Model(&models.MessageRequest{}).Where("conversation_id = ?", conv.ID).Count(&newCount)
		require.NoError(t, database.DB.Error)
		require.Equal(t, int64(0), newCount)
	})
}

func TestMessageRepository(t *testing.T) {
	cleanup := testutil.SetupTestDB(t)
	defer cleanup()

	convRepo := NewConversationRepository()
	msgRepo := NewMessageRepository()
	userRepo := NewUserRepository()

	user := &models.User{
		Email:        "msg_test@example.com",
		PasswordHash: "hash",
	}
	require.NoError(t, userRepo.Create(user))

	conv := &models.Conversation{
		UserID: user.ID,
		Title:  "Message Test",
	}
	require.NoError(t, convRepo.Create(conv))

	t.Run("Create", func(t *testing.T) {
		msg := &models.Message{
			ConversationID: conv.ID,
			Role:           models.RoleUser,
			Content:        "Test message",
		}

		err := msgRepo.Create(msg)

		require.NoError(t, err)
		assert.Greater(t, msg.ID, uint(0))
	})

	t.Run("FindByConversationID", func(t *testing.T) {
		// Create messages
		for i := 0; i < 3; i++ {
			msg := &models.Message{
				ConversationID: conv.ID,
				Role:           models.RoleUser,
				Content:        "Message",
			}
			require.NoError(t, msgRepo.Create(msg))
		}

		messages, err := msgRepo.FindByConversationID(conv.ID)

		require.NoError(t, err)
		assert.GreaterOrEqual(t, len(messages), 3)
	})

	t.Run("GetLastAssistantMessage", func(t *testing.T) {
		conv2 := &models.Conversation{
			UserID: user.ID,
			Title:  "Last Assistant",
		}
		require.NoError(t, convRepo.Create(conv2))

		msg1 := &models.Message{
			ConversationID: conv2.ID,
			Role:           models.RoleUser,
			Content:        "Question",
		}
		msg2 := &models.Message{
			ConversationID: conv2.ID,
			Role:           models.RoleAssistant,
			Content:        "First answer",
		}
		msg3 := &models.Message{
			ConversationID: conv2.ID,
			Role:           models.RoleAssistant,
			Content:        "Latest answer",
		}
		require.NoError(t, msgRepo.Create(msg1))
		require.NoError(t, msgRepo.Create(msg2))
		require.NoError(t, msgRepo.Create(msg3))

		last, err := msgRepo.GetLastAssistantMessage(conv2.ID)

		require.NoError(t, err)
		require.NotNil(t, last)
		assert.Equal(t, "Latest answer", last.Content)
	})
}
