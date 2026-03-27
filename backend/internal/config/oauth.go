package config

import (
	"fmt"

	"github.com/chat-note/backend/internal/models"
)

type OAuthConfig struct {
	Google OAuthProviderConfig `yaml:"google"`
	GitHub OAuthProviderConfig `yaml:"github"`
	QQ     OAuthProviderConfig `yaml:"qq"`
}

type OAuthProviderConfig struct {
	ClientID     string `yaml:"client_id"`
	ClientSecret string `yaml:"client_secret"`
	RedirectURI  string `yaml:"redirect_uri"`
	Enabled      bool   `yaml:"enabled"`
}

func (c *OAuthConfig) GetProviderConfig(provider string) (*OAuthProviderConfig, error) {
	switch provider {
	case models.OAuthProviderGoogle:
		return &c.Google, nil
	case models.OAuthProviderGitHub:
		return &c.GitHub, nil
	case models.OAuthProviderQQ:
		return &c.QQ, nil
	default:
		return nil, fmt.Errorf("unsupported OAuth provider: %s", provider)
	}
}

func (c *OAuthConfig) IsProviderEnabled(provider string) bool {
	config, err := c.GetProviderConfig(provider)
	if err != nil {
		return false
	}
	return config.Enabled && config.ClientID != "" && config.ClientSecret != ""
}

func (c *OAuthConfig) GetEnabledProviders() []string {
	providers := []string{}
	if c.IsProviderEnabled(models.OAuthProviderGoogle) {
		providers = append(providers, models.OAuthProviderGoogle)
	}
	if c.IsProviderEnabled(models.OAuthProviderGitHub) {
		providers = append(providers, models.OAuthProviderGitHub)
	}
	if c.IsProviderEnabled(models.OAuthProviderQQ) {
		providers = append(providers, models.OAuthProviderQQ)
	}
	return providers
}
