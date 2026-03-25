package models

import (
	"time"

	"github.com/google/uuid"
)

type Conversation struct {
	ID                    uint       `gorm:"primaryKey" json:"id"`
	UserID                uint       `gorm:"not null;index" json:"user_id"`
	CurrentProviderModelID *uuid.UUID `gorm:"type:uuid" json:"current_provider_model_id"` // Currently selected model (can be switched)
	ModelID               string     `gorm:"size:255" json:"model_id"`                   // Snapshot of model_id, preserved after model deletion
	Title                 string     `gorm:"size:500" json:"title"`
	IsSaved               bool       `gorm:"default:false" json:"is_saved"`
	Messages              []Message  `gorm:"foreignKey:ConversationID;constraint:OnDelete:CASCADE" json:"messages,omitempty"`
	CreatedAt             time.Time  `json:"created_at"`
	UpdatedAt             time.Time  `json:"updated_at"`

	CurrentProviderModel *ProviderModel `gorm:"foreignKey:CurrentProviderModelID" json:"-"`
}

func (Conversation) TableName() string {
	return "conversations"
}
