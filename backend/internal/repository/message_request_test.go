package repository

import (
	"testing"

	"github.com/chat-note/backend/internal/models"
	"github.com/chat-note/backend/internal/testutil"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMessageRequestRepository(t *testing.T) {
	cleanup := testutil.SetupTestDB(t)
	defer cleanup()

	convRepo := NewConversationRepository()
	msgRepo := NewMessageRepository()
	userRepo := NewUserRepository()
	requestRepo := NewMessageRequestRepository()

	// Create test user
	user := &models.User{
		Email:        "request_test@example.com",
		PasswordHash: "hash",
	}
	require.NoError(t, userRepo.Create(user))

	// Create test conversation
	conv := &models.Conversation{
		UserID: user.ID,
		Title:  "Request Test",
	}
	require.NoError(t, convRepo.Create(conv))

	t.Run("CreateIfNotExists_NewRequest", func(t *testing.T) {
		requestID := uuid.New().String()
		req := &models.MessageRequest{
			ConversationID: conv.ID,
			RequestID:      requestID,
			Status:         models.StatusProcessing,
		}

		created, err := requestRepo.CreateIfNotExists(req)

		require.NoError(t, err)
		assert.NotNil(t, created)
		assert.Greater(t, created.ID, uint(0))
		assert.Equal(t, requestID, created.RequestID)
		assert.Equal(t, models.StatusProcessing, created.Status)
	})

	t.Run("CreateIfNotExists_DuplicateRequest", func(t *testing.T) {
		requestID := uuid.New().String()
		req1 := &models.MessageRequest{
			ConversationID: conv.ID,
			RequestID:      requestID,
			Status:         models.StatusProcessing,
		}

		created1, err := requestRepo.CreateIfNotExists(req1)
		require.NoError(t, err)
		assert.NotNil(t, created1)

		// Try to create with same request_id
		req2 := &models.MessageRequest{
			ConversationID: conv.ID,
			RequestID:      requestID,
			Status:         models.StatusProcessing,
		}

		created2, err := requestRepo.CreateIfNotExists(req2)

		assert.ErrorIs(t, err, ErrRequestAlreadyExists)
		assert.Nil(t, created2)
	})

	t.Run("FindByRequestID_Exists", func(t *testing.T) {
		requestID := uuid.New().String()
		req := &models.MessageRequest{
			ConversationID: conv.ID,
			RequestID:      requestID,
			Status:         models.StatusProcessing,
		}
		_, err := requestRepo.CreateIfNotExists(req)
		require.NoError(t, err)

		found, err := requestRepo.FindByRequestID(requestID)

		require.NoError(t, err)
		assert.NotNil(t, found)
		assert.Equal(t, requestID, found.RequestID)
		assert.Equal(t, conv.ID, found.ConversationID)
	})

	t.Run("FindByRequestID_NotExists", func(t *testing.T) {
		found, err := requestRepo.FindByRequestID("non-existent-request-id")

		assert.ErrorIs(t, err, ErrRequestNotFound)
		assert.Nil(t, found)
	})

	t.Run("UpdateStatus", func(t *testing.T) {
		requestID := uuid.New().String()
		req := &models.MessageRequest{
			ConversationID: conv.ID,
			RequestID:      requestID,
			Status:         models.StatusProcessing,
		}
		created, err := requestRepo.CreateIfNotExists(req)
		require.NoError(t, err)

		err = requestRepo.UpdateStatus(created.ID, models.StatusCompleted)

		require.NoError(t, err)

		found, _ := requestRepo.FindByRequestID(requestID)
		assert.Equal(t, models.StatusCompleted, found.Status)
	})

	t.Run("SetUserMessage", func(t *testing.T) {
		requestID := uuid.New().String()
		req := &models.MessageRequest{
			ConversationID: conv.ID,
			RequestID:      requestID,
			Status:         models.StatusProcessing,
		}
		created, err := requestRepo.CreateIfNotExists(req)
		require.NoError(t, err)

		// Create a user message
		userMsg := &models.Message{
			ConversationID: conv.ID,
			Role:           models.RoleUser,
			Content:        "Test question",
		}
		require.NoError(t, msgRepo.Create(userMsg))

		err = requestRepo.SetUserMessage(created.ID, userMsg.ID)

		require.NoError(t, err)

		found, _ := requestRepo.FindByRequestIDWithMessages(requestID)
		assert.NotNil(t, found.UserMessageID)
		assert.Equal(t, userMsg.ID, *found.UserMessageID)
	})

	t.Run("SetCompleted", func(t *testing.T) {
		requestID := uuid.New().String()
		req := &models.MessageRequest{
			ConversationID: conv.ID,
			RequestID:      requestID,
			Status:         models.StatusProcessing,
		}
		created, err := requestRepo.CreateIfNotExists(req)
		require.NoError(t, err)

		// Create an assistant message
		assistantMsg := &models.Message{
			ConversationID: conv.ID,
			Role:           models.RoleAssistant,
			Content:        "Test answer",
		}
		require.NoError(t, msgRepo.Create(assistantMsg))

		err = requestRepo.SetCompleted(created.ID, assistantMsg.ID)

		require.NoError(t, err)

		found, _ := requestRepo.FindByRequestIDWithMessages(requestID)
		assert.Equal(t, models.StatusCompleted, found.Status)
		assert.NotNil(t, found.AssistantMessageID)
		assert.Equal(t, assistantMsg.ID, *found.AssistantMessageID)
	})

	t.Run("SetFailed", func(t *testing.T) {
		requestID := uuid.New().String()
		req := &models.MessageRequest{
			ConversationID: conv.ID,
			RequestID:      requestID,
			Status:         models.StatusProcessing,
		}
		created, err := requestRepo.CreateIfNotExists(req)
		require.NoError(t, err)

		err = requestRepo.SetFailed(created.ID)

		require.NoError(t, err)

		found, _ := requestRepo.FindByRequestID(requestID)
		assert.Equal(t, models.StatusFailed, found.Status)
	})

	t.Run("Delete", func(t *testing.T) {
		requestID := uuid.New().String()
		req := &models.MessageRequest{
			ConversationID: conv.ID,
			RequestID:      requestID,
			Status:         models.StatusProcessing,
		}
		created, err := requestRepo.CreateIfNotExists(req)
		require.NoError(t, err)

		err = requestRepo.Delete(created.ID)

		require.NoError(t, err)

		found, err := requestRepo.FindByRequestID(requestID)
		assert.ErrorIs(t, err, ErrRequestNotFound)
		assert.Nil(t, found)
	})

	t.Run("FullWorkflow_NewRequest", func(t *testing.T) {
		requestID := uuid.New().String()

		// 1. Create request
		req := &models.MessageRequest{
			ConversationID: conv.ID,
			RequestID:      requestID,
			Status:         models.StatusProcessing,
		}
		created, err := requestRepo.CreateIfNotExists(req)
		require.NoError(t, err)

		// 2. Save user message
		userMsg := &models.Message{
			ConversationID: conv.ID,
			Role:           models.RoleUser,
			Content:        "What is AI?",
		}
		require.NoError(t, msgRepo.Create(userMsg))
		require.NoError(t, requestRepo.SetUserMessage(created.ID, userMsg.ID))

		// 3. Save assistant message
		assistantMsg := &models.Message{
			ConversationID: conv.ID,
			Role:           models.RoleAssistant,
			Content:        "AI stands for Artificial Intelligence.",
		}
		require.NoError(t, msgRepo.Create(assistantMsg))
		require.NoError(t, requestRepo.SetCompleted(created.ID, assistantMsg.ID))

		// 4. Verify completed state
		found, err := requestRepo.FindByRequestIDWithMessages(requestID)
		require.NoError(t, err)
		assert.Equal(t, models.StatusCompleted, found.Status)
		assert.NotNil(t, found.UserMessageID)
		assert.NotNil(t, found.AssistantMessageID)
	})

	t.Run("FullWorkflow_RetryCompletedRequest", func(t *testing.T) {
		requestID := uuid.New().String()

		// 1. Create and complete request
		req := &models.MessageRequest{
			ConversationID: conv.ID,
			RequestID:      requestID,
			Status:         models.StatusProcessing,
		}
		created, err := requestRepo.CreateIfNotExists(req)
		require.NoError(t, err)

		userMsg := &models.Message{
			ConversationID: conv.ID,
			Role:           models.RoleUser,
			Content:        "Hello",
		}
		require.NoError(t, msgRepo.Create(userMsg))

		assistantMsg := &models.Message{
			ConversationID: conv.ID,
			Role:           models.RoleAssistant,
			Content:        "Hi!",
		}
		require.NoError(t, msgRepo.Create(assistantMsg))
		require.NoError(t, requestRepo.SetCompleted(created.ID, assistantMsg.ID))

		// 2. Try to create same request again (should fail)
		req2 := &models.MessageRequest{
			ConversationID: conv.ID,
			RequestID:      requestID,
			Status:         models.StatusProcessing,
		}
		_, err = requestRepo.CreateIfNotExists(req2)
		assert.ErrorIs(t, err, ErrRequestAlreadyExists)

		// 3. Find existing request should return completed state
		found, err := requestRepo.FindByRequestID(requestID)
		require.NoError(t, err)
		assert.Equal(t, models.StatusCompleted, found.Status)
	})
}
