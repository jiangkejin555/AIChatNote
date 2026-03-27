package models

import (
	"time"
)

type OAuthAccount struct {
	ID              uint       `gorm:"primaryKey" json:"id"`
	UserID          uint       `gorm:"not null;index" json:"user_id"`
	Provider        string     `gorm:"not null;size:50;uniqueIndex:idx_provider_user" json:"provider"`
	ProviderUserID  string     `gorm:"not null;size:255;uniqueIndex:idx_provider_user" json:"provider_user_id"`
	AccessToken     *string    `gorm:"type:text" json:"-"`
	RefreshToken    *string    `gorm:"type:text" json:"-"`
	TokenExpiresAt  *time.Time `json:"-"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

func (OAuthAccount) TableName() string {
	return "oauth_accounts"
}

const (
	OAuthProviderGoogle = "google"
	OAuthProviderGitHub = "github"
	OAuthProviderQQ     = "qq"
)

func IsValidOAuthProvider(provider string) bool {
	switch provider {
	case OAuthProviderGoogle, OAuthProviderGitHub, OAuthProviderQQ:
		return true
	default:
		return false
	}
}
