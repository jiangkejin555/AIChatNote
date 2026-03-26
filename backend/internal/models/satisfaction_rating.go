package models

import "time"

type SatisfactionRating struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"uniqueIndex;not null" json:"user_id"`
	Rating    int       `gorm:"not null" json:"rating"`
	Comment   string    `json:"comment,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (SatisfactionRating) TableName() string {
	return "satisfaction_ratings"
}
