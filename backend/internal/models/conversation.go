package models

import (
	"time"

	"github.com/google/uuid"
)

type Conversation struct {
	ID              uint       `gorm:"primaryKey" json:"id"`
	UserID          uint       `gorm:"not null;index" json:"user_id"`
	ProviderModelID *uuid.UUID `gorm:"type:uuid" json:"provider_model_id"`
	ModelID         string     `gorm:"size:255" json:"model_id"` // Snapshot of model_id, preserved after model deletion
	Title           string     `gorm:"size:500" json:"title"`
	IsSaved         bool       `gorm:"default:false" json:"is_saved"`
	Messages        []Message  `gorm:"foreignKey:ConversationID;constraint:OnDelete:CASCADE" json:"messages,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`

	ProviderModel *ProviderModel `gorm:"foreignKey:ProviderModelID" json:"-"`
}

func (Conversation) TableName() string {
	return "conversations"
}
