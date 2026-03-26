package models

import (
	"time"
)

// ConversationSummary stores a compressed summary of conversation history
// for token optimization when sending context to LLM
type ConversationSummary struct {
	ID             uint      `gorm:"primaryKey" json:"id"`
	ConversationID uint      `gorm:"uniqueIndex;not null" json:"conversation_id"`
	Summary        string    `gorm:"type:text;not null" json:"summary"`
	EndMessageID   uint      `gorm:"not null" json:"end_message_id"` // ID of the last message covered by this summary
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`

	// Relations
	Conversation *Conversation `gorm:"foreignKey:ConversationID" json:"-"`
}

func (ConversationSummary) TableName() string {
	return "conversation_summaries"
}
