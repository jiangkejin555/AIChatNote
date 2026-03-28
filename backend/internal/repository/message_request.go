package repository

import (
	"errors"

	"github.com/chat-note/backend/internal/database"
	"github.com/chat-note/backend/internal/models"
	"gorm.io/gorm"
)

var (
	ErrRequestAlreadyExists = errors.New("request already exists")
	ErrRequestNotFound      = errors.New("request not found")
)

type MessageRequestRepository struct{}

func NewMessageRequestRepository() *MessageRequestRepository {
	return &MessageRequestRepository{}
}

// CreateIfNotExists attempts to create a new request record.
// Returns ErrRequestAlreadyExists if a record with the same request_id already exists.
func (r *MessageRequestRepository) CreateIfNotExists(req *models.MessageRequest) (*models.MessageRequest, error) {
	err := database.DB.Create(req).Error
	if err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return nil, ErrRequestAlreadyExists
		}
		return nil, err
	}
	return req, nil
}

// FindByRequestID finds a request by its unique request_id
func (r *MessageRequestRepository) FindByRequestID(requestID string) (*models.MessageRequest, error) {
	var req models.MessageRequest
	err := database.DB.Where("request_id = ?", requestID).First(&req).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRequestNotFound
		}
		return nil, err
	}
	return &req, nil
}

// FindByRequestIDWithMessages finds a request with its associated messages
func (r *MessageRequestRepository) FindByRequestIDWithMessages(requestID string) (*models.MessageRequest, error) {
	var req models.MessageRequest
	err := database.DB.Where("request_id = ?", requestID).
		Preload("UserMessage").
		Preload("AssistantMessage").
		First(&req).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrRequestNotFound
		}
		return nil, err
	}
	return &req, nil
}

// UpdateStatus updates the status of a request
func (r *MessageRequestRepository) UpdateStatus(id uint, status models.RequestStatus) error {
	return database.DB.Model(&models.MessageRequest{}).
		Where("id = ?", id).
		Update("status", status).Error
}

// SetUserMessage sets the user message ID for a request
func (r *MessageRequestRepository) SetUserMessage(id uint, messageID uint) error {
	return database.DB.Model(&models.MessageRequest{}).
		Where("id = ?", id).
		Update("user_message_id", messageID).Error
}

// SetCompleted marks a request as completed with the assistant message
func (r *MessageRequestRepository) SetCompleted(id uint, assistantMessageID uint) error {
	return database.DB.Model(&models.MessageRequest{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"status":               models.StatusCompleted,
			"assistant_message_id": assistantMessageID,
		}).Error
}

// SetFailed marks a request as failed
func (r *MessageRequestRepository) SetFailed(id uint) error {
	return database.DB.Model(&models.MessageRequest{}).
		Where("id = ?", id).
		Update("status", models.StatusFailed).Error
}

// ClearAssistantMessageID sets assistant_message_id to NULL for all records
// referencing the given message ID. This is needed before deleting a message
// to avoid foreign key constraint violations.
func (r *MessageRequestRepository) ClearAssistantMessageID(messageID uint) error {
	return database.DB.Model(&models.MessageRequest{}).
		Where("assistant_message_id = ?", messageID).
		Update("assistant_message_id", nil).Error
}

// Delete removes a request record
func (r *MessageRequestRepository) Delete(id uint) error {
	return database.DB.Delete(&models.MessageRequest{}, id).Error
}

// DeleteByConversationID removes all request records for a conversation
func (r *MessageRequestRepository) DeleteByConversationID(conversationID uint) error {
	return database.DB.Where("conversation_id = ?", conversationID).Delete(&models.MessageRequest{}).Error
}
