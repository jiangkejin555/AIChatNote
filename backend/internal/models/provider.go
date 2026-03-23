package models

import (
	"time"

	"github.com/google/uuid"
)

type ProviderType string

const (
	ProviderOpenAI     ProviderType = "openai"
	ProviderVolcengine ProviderType = "volcengine"
	ProviderDeepSeek   ProviderType = "deepseek"
	ProviderAnthropic  ProviderType = "anthropic"
	ProviderGoogle     ProviderType = "google"
	ProviderMoonshot   ProviderType = "moonshot"
	ProviderZhipu      ProviderType = "zhipu"
	ProviderCustom     ProviderType = "custom"
)

type Provider struct {
	ID              uuid.UUID     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID          uint          `gorm:"not null;index" json:"user_id"`
	Name            string        `gorm:"not null;size:255" json:"name"`
	Type            ProviderType  `gorm:"not null;size:50" json:"type"`
	APIBase         string        `gorm:"not null;size:500" json:"api_base"`
	APIKeyEncrypted string        `gorm:"type:text" json:"-"`
	Models          []ProviderModel `gorm:"foreignKey:ProviderID;constraint:OnDelete:CASCADE" json:"models"`
	CreatedAt       time.Time     `json:"created_at"`
	UpdatedAt       time.Time     `json:"updated_at"`
}

func (Provider) TableName() string {
	return "providers"
}
