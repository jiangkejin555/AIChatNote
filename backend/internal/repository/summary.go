package repository

import (
	"errors"

	"github.com/chat-note/backend/internal/database"
	"github.com/chat-note/backend/internal/models"
	"gorm.io/gorm"
)

var (
	ErrSummaryNotFound = errors.New("summary not found")
)

type SummaryRepository struct{}

func NewSummaryRepository() *SummaryRepository {
	return &SummaryRepository{}
}

// FindByConversationID finds a summary by conversation ID
func (r *SummaryRepository) FindByConversationID(conversationID uint) (*models.ConversationSummary, error) {
	var summary models.ConversationSummary
	err := database.DB.Where("conversation_id = ?", conversationID).First(&summary).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrSummaryNotFound
		}
		return nil, err
	}
	return &summary, nil
}

// Create creates a new conversation summary
func (r *SummaryRepository) Create(summary *models.ConversationSummary) error {
	return database.DB.Create(summary).Error
}

// Update updates an existing conversation summary
func (r *SummaryRepository) Update(summary *models.ConversationSummary) error {
	return database.DB.Save(summary).Error
}

// Upsert creates a new summary or updates the existing one for the conversation
func (r *SummaryRepository) Upsert(summary *models.ConversationSummary) error {
	return database.DB.Transaction(func(tx *gorm.DB) error {
		var existing models.ConversationSummary
		err := tx.Where("conversation_id = ?", summary.ConversationID).First(&existing).Error

		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				// Create new
				return tx.Create(summary).Error
			}
			return err
		}

		// Update existing
		existing.Summary = summary.Summary
		existing.EndMessageID = summary.EndMessageID
		return tx.Save(&existing).Error
	})
}

// Delete removes a summary by conversation ID
func (r *SummaryRepository) Delete(conversationID uint) error {
	return database.DB.Where("conversation_id = ?", conversationID).Delete(&models.ConversationSummary{}).Error
}
