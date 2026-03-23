package models

import (
	"time"
)

type MessageRole string

const (
	RoleUser      MessageRole = "user"
	RoleAssistant MessageRole = "assistant"
)

type Message struct {
	ID             uint        `gorm:"primaryKey" json:"id"`
	ConversationID uint        `gorm:"not null;index" json:"conversation_id"`
	Role           MessageRole `gorm:"not null;size:20" json:"role"`
	Content        string      `gorm:"type:text;not null" json:"content"`
	CreatedAt      time.Time   `json:"created_at"`
}

func (Message) TableName() string {
	return "messages"
}
