package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

// MessageType defines the type of notification
type MessageType string

const (
	MessageTypeSystem MessageType = "system"
	MessageTypeAITask MessageType = "ai_task"
	MessageTypeError  MessageType = "error"
)

// NotificationPayload stores resource linking info
type NotificationPayload struct {
	ResourceType string `json:"resource_type,omitempty"` // note, model, conversation, announcement
	ResourceID   string `json:"resource_id,omitempty"`
	URL          string `json:"url,omitempty"`
}

// Value implements driver.Valuer for JSONB
func (p NotificationPayload) Value() (driver.Value, error) {
	return json.Marshal(p)
}

// Scan implements sql.Scanner for JSONB
func (p *NotificationPayload) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, p)
}

// Notification represents a user notification
type Notification struct {
	ID           uint                `gorm:"primaryKey" json:"id"`
	UserID       uint                `gorm:"not null;index" json:"user_id"`
	TemplateCode string              `gorm:"size:50;not null" json:"template_code"`
	Type         MessageType         `gorm:"size:20;not null" json:"type"`
	Title        string              `gorm:"size:255;not null" json:"title"`
	Content      string              `gorm:"type:text" json:"content"`
	Payload      NotificationPayload `gorm:"type:jsonb" json:"payload"`
	ReadAt       *time.Time          `json:"read_at"`
	CreatedAt    time.Time           `json:"created_at"`

	User *User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
}

func (Notification) TableName() string {
	return "notifications"
}
