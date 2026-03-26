package models

import "time"

type FeatureStatus string

const (
	FeatureStatusPlanned    FeatureStatus = "planned"
	FeatureStatusInProgress FeatureStatus = "in_progress"
	FeatureStatusCompleted  FeatureStatus = "completed"
)

type FeatureRequest struct {
	ID          uint          `gorm:"primaryKey" json:"id"`
	Title       string        `gorm:"not null;size:255" json:"title"`
	Description string        `gorm:"not null;type:text" json:"description"`
	Status      FeatureStatus `gorm:"default:planned;size:50" json:"status"`
	CreatedAt   time.Time     `json:"created_at"`
	UpdatedAt   time.Time     `json:"updated_at"`
}

func (FeatureRequest) TableName() string {
	return "feature_requests"
}

type FeatureVote struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;uniqueIndex:idx_user_feature;index" json:"user_id"`
	FeatureID uint      `gorm:"not null;uniqueIndex:idx_user_feature;index" json:"feature_id"`
	CreatedAt time.Time `json:"created_at"`
}

func (FeatureVote) TableName() string {
	return "feature_votes"
}
