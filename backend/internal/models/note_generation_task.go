package models

import (
	"time"
)

type TaskStatus string

const (
	TaskStatusGenerating TaskStatus = "generating"
	TaskStatusDone       TaskStatus = "done"
	TaskStatusFailed     TaskStatus = "failed"
)

type NoteGenerationTask struct {
	ID             uint       `gorm:"primaryKey" json:"id"`
	UserID         uint       `gorm:"not null;index" json:"user_id"`
	ConversationID uint       `gorm:"not null" json:"conversation_id"`
	Status         TaskStatus `gorm:"size:20;not null;default:generating;index" json:"status"`
	ErrorMessage   string     `gorm:"type:text" json:"error_message"`
	NoteID         *uint      `json:"note_id"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

func (NoteGenerationTask) TableName() string {
	return "note_generation_tasks"
}
