package models

import "time"

type FeedbackType string

const (
	FeedbackTypeBug     FeedbackType = "bug"
	FeedbackTypeFeature FeedbackType = "feature"
	FeedbackTypeOther   FeedbackType = "other"
)

type FeedbackStatus string

const (
	FeedbackStatusPending    FeedbackStatus = "pending"
	FeedbackStatusInProgress FeedbackStatus = "in_progress"
	FeedbackStatusResolved   FeedbackStatus = "resolved"
	FeedbackStatusClosed     FeedbackStatus = "closed"
)

type Feedback struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	UserID      uint           `gorm:"not null;index" json:"user_id"`
	Type        FeedbackType   `gorm:"not null;size:50" json:"type"`
	Title       string         `gorm:"not null;size:255" json:"title"`
	Description string         `gorm:"not null;type:text" json:"description"`
	Contact     string         `gorm:"size:255" json:"contact,omitempty"`
	Status      FeedbackStatus `gorm:"default:pending;size:50;index" json:"status"`
	AdminReply  string         `json:"admin_reply,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

func (Feedback) TableName() string {
	return "feedbacks"
}
