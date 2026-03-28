package models

import (
	"time"

	"github.com/google/uuid"
)

type MessageRole string

const (
	RoleUser      MessageRole = "user"
	RoleAssistant MessageRole = "assistant"
)

type Message struct {
	ID              uint        `gorm:"primaryKey" json:"id"`
	ConversationID  uint        `gorm:"not null;index" json:"conversation_id"`
	Role            MessageRole `gorm:"not null;size:20" json:"role"`
	Content         string      `gorm:"type:text;not null" json:"content"`
	ProviderModelID *uuid.UUID  `gorm:"type:uuid" json:"provider_model_id"` // Model used for this message (assistant messages only)
	ModelID         string      `gorm:"size:255" json:"model_id"`           // Snapshot of model_id (e.g., "gpt-4o"), preserved after model deletion
	Canceled        bool        `gorm:"default:false" json:"canceled"`      // Whether the generation was manually canceled by the user
	CreatedAt       time.Time   `json:"created_at"`

	ProviderModel *ProviderModel `gorm:"foreignKey:ProviderModelID" json:"-"`
}

func (Message) TableName() string {
	return "messages"
}
