package models

import (
	"time"
)

// ContextMode defines how conversation context is processed
type ContextMode string

const (
	ContextModeSummary ContextMode = "summary" // Sliding window + summary compression
	ContextModeSimple  ContextMode = "simple"  // Direct pass of recent messages
)

// MemoryLevel defines the length of context memory
type MemoryLevel string

const (
	MemoryLevelShort  MemoryLevel = "short"  // Short-term memory (fewer messages)
	MemoryLevelNormal MemoryLevel = "normal" // Normal memory (balanced)
	MemoryLevelLong   MemoryLevel = "long"   // Long-term memory (more messages)
)

// UserSettings stores user preferences for context processing
type UserSettings struct {
	ID          uint        `gorm:"primaryKey" json:"id"`
	UserID      uint        `gorm:"uniqueIndex;not null" json:"user_id"`
	ContextMode ContextMode `gorm:"type:varchar(20);default:'simple'" json:"context_mode"`
	MemoryLevel MemoryLevel `gorm:"type:varchar(20);default:'normal'" json:"memory_level"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`

	// Relations
	User *User `gorm:"foreignKey:UserID" json:"-"`
}

func (UserSettings) TableName() string {
	return "user_settings"
}
