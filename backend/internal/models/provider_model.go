package models

import (
	"time"

	"github.com/google/uuid"
)

type ProviderModel struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ProviderID  uuid.UUID `gorm:"type:uuid;not null;index" json:"provider_id"`
	ModelID     string    `gorm:"not null;size:255" json:"model_id"`
	DisplayName string    `gorm:"not null;size:255" json:"display_name"`
	IsDefault   bool      `gorm:"default:false" json:"is_default"`
	Enabled     bool      `gorm:"default:true" json:"enabled"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	Provider *Provider `gorm:"foreignKey:ProviderID" json:"-"`
}

func (ProviderModel) TableName() string {
	return "provider_models"
}
