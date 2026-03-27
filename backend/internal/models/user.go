package models

import (
	"time"
)

type User struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	Email         string    `gorm:"uniqueIndex;not null;size:255" json:"email"`
	PasswordHash  string    `gorm:"not null;size:255" json:"-"`
	Nickname      *string   `gorm:"size:255" json:"nickname"`
	AvatarURL     *string   `gorm:"type:text" json:"avatar_url"`
	EmailVerified bool      `gorm:"default:false" json:"email_verified"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

func (User) TableName() string {
	return "users"
}
