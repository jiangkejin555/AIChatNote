package models

import (
	"time"
)

// RequestStatus represents the status of a message request
type RequestStatus string

const (
	StatusPending    RequestStatus = "pending"
	StatusProcessing RequestStatus = "processing"
	StatusCompleted  RequestStatus = "completed"
	StatusFailed     RequestStatus = "failed"
)

// MessageRequest tracks message requests for deduplication
type MessageRequest struct {
	ID                 uint          `gorm:"primaryKey" json:"id"`
	ConversationID     uint          `gorm:"not null;index" json:"conversation_id"`
	RequestID          string        `gorm:"type:varchar(36);uniqueIndex;not null" json:"request_id"`
	UserMessageID      *uint         `gorm:"index" json:"user_message_id"`
	AssistantMessageID *uint         `gorm:"index" json:"assistant_message_id"`
	Status             RequestStatus `gorm:"type:varchar(20);not null;default:pending" json:"status"`
	CreatedAt          time.Time     `json:"created_at"`
	UpdatedAt          time.Time     `json:"updated_at"`

	// Relations for Preload
	UserMessage      *Message `gorm:"foreignKey:UserMessageID" json:"user_message,omitempty"`
	AssistantMessage *Message `gorm:"foreignKey:AssistantMessageID" json:"assistant_message,omitempty"`
}

func (MessageRequest) TableName() string {
	return "message_requests"
}
