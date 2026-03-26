package repository

import (
	"github.com/chat-note/backend/internal/database"
	"github.com/chat-note/backend/internal/models"
	"gorm.io/gorm"
)

type ConversationRepository struct{}

func NewConversationRepository() *ConversationRepository {
	return &ConversationRepository{}
}

func (r *ConversationRepository) Create(conv *models.Conversation) error {
	return database.DB.Create(conv).Error
}

func (r *ConversationRepository) FindByUserID(userID uint) ([]models.Conversation, error) {
	var conversations []models.Conversation
	err := database.DB.Where("user_id = ?", userID).
		Order("updated_at DESC").
		Find(&conversations).Error
	return conversations, err
}

// FindByIDAndUserID 根据 ID 和 UserID 查询会话（推荐使用，确保数据隔离）
func (r *ConversationRepository) FindByIDAndUserID(id, userID uint) (*models.Conversation, error) {
	var conv models.Conversation
	err := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&conv).Error
	if err != nil {
		return nil, err
	}
	return &conv, nil
}

// FindByIDWithMessagesAndUserID 根据 ID 和 UserID 查询会话及其消息（推荐使用，确保数据隔离）
func (r *ConversationRepository) FindByIDWithMessagesAndUserID(id, userID uint) (*models.Conversation, error) {
	var conv models.Conversation
	err := database.DB.Where("id = ? AND user_id = ?", id, userID).
		Preload("Messages", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at ASC")
		}).First(&conv).Error
	if err != nil {
		return nil, err
	}
	return &conv, nil
}

func (r *ConversationRepository) Update(conv *models.Conversation) error {
	return database.DB.Save(conv).Error
}

func (r *ConversationRepository) Delete(id, userID uint) error {
	return database.DB.Transaction(func(tx *gorm.DB) error {
		// Delete associated message_requests first
		if err := tx.Where("conversation_id = ?", id).Delete(&models.MessageRequest{}).Error; err != nil {
			return err
		}
		// Then delete the conversation
		return tx.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Conversation{}).Error
	})
}

// UpdateTitle 更新对话标题（同时更新 updated_at 以触发排序刷新）
func (r *ConversationRepository) UpdateTitle(id, userID uint, title string) error {
	return database.DB.Model(&models.Conversation{}).
		Where("id = ? AND user_id = ?", id, userID).
		Updates(map[string]interface{}{
			"title":      title,
			"updated_at": gorm.Expr("CURRENT_TIMESTAMP"),
		}).Error
}

// UpdateCurrentModel 更新对话的当前模型
func (r *ConversationRepository) UpdateCurrentModel(id, userID uint, providerModelID *string, modelID string) error {
	updates := map[string]interface{}{
		"current_provider_model_id": providerModelID,
		"model_id":                 modelID,
		"updated_at":               gorm.Expr("CURRENT_TIMESTAMP"),
	}
	return database.DB.Model(&models.Conversation{}).
		Where("id = ? AND user_id = ?", id, userID).
		Updates(updates).Error
}

// ClearCurrentModelByProviderModelID clears the current_provider_model_id for all conversations
// using the specified provider_model_id (used when a model is deleted)
func (r *ConversationRepository) ClearCurrentModelByProviderModelID(providerModelID string) error {
	return database.DB.Model(&models.Conversation{}).
		Where("current_provider_model_id = ?", providerModelID).
		Updates(map[string]any{
			"current_provider_model_id": nil,
			"updated_at":               gorm.Expr("CURRENT_TIMESTAMP"),
		}).Error
}

type MessageRepository struct{}

func NewMessageRepository() *MessageRepository {
	return &MessageRepository{}
}

func (r *MessageRepository) Create(msg *models.Message) error {
	return database.DB.Create(msg).Error
}

func (r *MessageRepository) FindByID(id uint) (*models.Message, error) {
	var msg models.Message
	err := database.DB.First(&msg, id).Error
	if err != nil {
		return nil, err
	}
	return &msg, nil
}

func (r *MessageRepository) FindByConversationID(convID uint) ([]models.Message, error) {
	var messages []models.Message
	err := database.DB.Where("conversation_id = ?", convID).
		Order("created_at ASC").
		Find(&messages).Error
	return messages, err
}

// FindRecentByConversationID returns the most recent N messages for a conversation
// in chronological order (oldest first). Used for simple context mode.
func (r *MessageRepository) FindRecentByConversationID(convID uint, limit int) ([]models.Message, error) {
	var messages []models.Message
	// Use subquery to get the most recent N messages, then order them chronologically
	subQuery := database.DB.Model(&models.Message{}).
		Select("id").
		Where("conversation_id = ?", convID).
		Order("created_at DESC").
		Limit(limit)

	err := database.DB.Where("id IN (?)", subQuery).
		Order("created_at ASC").
		Find(&messages).Error
	return messages, err
}

func (r *MessageRepository) FindByConversationIDBefore(convID uint, beforeID uint, limit int) ([]models.Message, error) {
	var messages []models.Message
	query := database.DB.Where("conversation_id = ?", convID)
	if beforeID > 0 {
		query = query.Where("id < ?", beforeID)
	}
	err := query.Order("created_at DESC").Limit(limit).Find(&messages).Error
	return messages, err
}

func (r *MessageRepository) Delete(id uint) error {
	return database.DB.Delete(&models.Message{}, id).Error
}

func (r *MessageRepository) GetLastAssistantMessage(convID uint) (*models.Message, error) {
	var msg models.Message
	err := database.DB.Where("conversation_id = ? AND role = ?", convID, models.RoleAssistant).
		Order("created_at DESC").
		First(&msg).Error
	if err != nil {
		return nil, err
	}
	return &msg, nil
}

// GetFirstUserMessage 获取对话的首条用户消息
func (r *MessageRepository) GetFirstUserMessage(convID uint) (*models.Message, error) {
	var msg models.Message
	err := database.DB.Where("conversation_id = ? AND role = ?", convID, models.RoleUser).
		Order("created_at ASC").
		First(&msg).Error
	if err != nil {
		return nil, err
	}
	return &msg, nil
}
