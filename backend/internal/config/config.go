package config

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Server     ServerConfig     `yaml:"server"`
	Database   DatabaseConfig   `yaml:"database"`
	JWT        JWTConfig        `yaml:"jwt"`
	Encryption EncryptionConfig `yaml:"encryption"`
	NoteLLM    NoteLLMConfig    `yaml:"llm"`
	CORS       CORSConfig       `yaml:"cors"`
}

type ServerConfig struct {
	Port    string `yaml:"port"`
	GinMode string `yaml:"gin_mode"`
}

type DatabaseConfig struct {
	URL string `yaml:"url"`
}

type JWTConfig struct {
	Secret           string `yaml:"secret"`
	RefreshSecret    string `yaml:"refresh_secret"`
	ExpiryHours      int    `yaml:"expiry_hours"`
	RefreshExpiryHours int  `yaml:"refresh_expiry_hours"`

	// Computed values
	Expiry        time.Duration `yaml:"-"`
	RefreshExpiry time.Duration `yaml:"-"`
}

type EncryptionConfig struct {
	Key string `yaml:"key"`
}

type NoteLLMConfig struct {
	DeepSeekAPIKey  string `yaml:"deepseek_api_key"`
	DeepSeekAPIBase string `yaml:"deepseek_api_base"`
}

type CORSConfig struct {
	FrontendURL string `yaml:"frontend_url"`
}

// Load reads configuration from config.yaml file.
// Returns an error if config.yaml is not found.
func Load() (*Config, error) {
	return LoadFromPath("config.yaml")
}

// LoadFromPath reads configuration from a specific path.
func LoadFromPath(configPath string) (*Config, error) {
	// Find config file
	absPath, err := filepath.Abs(configPath)
	if err != nil {
		return nil, fmt.Errorf("failed to resolve config path: %w", err)
	}

	// Check if file exists
	if _, err := os.Stat(absPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("config file not found: %s", absPath)
	}

	// Read file
	data, err := os.ReadFile(absPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	// Parse YAML
	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("failed to parse config file: %w", err)
	}

	// Compute duration values
	cfg.JWT.Expiry = time.Duration(cfg.JWT.ExpiryHours) * time.Hour
	cfg.JWT.RefreshExpiry = time.Duration(cfg.JWT.RefreshExpiryHours) * time.Hour

	// Apply environment variable overrides (optional)
	applyEnvOverrides(&cfg)

	return &cfg, nil
}

// applyEnvOverrides applies environment variable overrides to the config.
// Environment variables take precedence over config file values.
func applyEnvOverrides(cfg *Config) {
	if v := os.Getenv("PORT"); v != "" {
		cfg.Server.Port = v
	}
	if v := os.Getenv("GIN_MODE"); v != "" {
		cfg.Server.GinMode = v
	}
	if v := os.Getenv("DATABASE_URL"); v != "" {
		cfg.Database.URL = v
	}
	if v := os.Getenv("JWT_SECRET"); v != "" {
		cfg.JWT.Secret = v
	}
	if v := os.Getenv("JWT_REFRESH_SECRET"); v != "" {
		cfg.JWT.RefreshSecret = v
	}
	if v := os.Getenv("ENCRYPTION_KEY"); v != "" {
		cfg.Encryption.Key = v
	}
	if v := os.Getenv("DEEPSEEK_API_KEY"); v != "" {
		cfg.NoteLLM.DeepSeekAPIKey = v
	}
	if v := os.Getenv("DEEPSEEK_API_BASE"); v != "" {
		cfg.NoteLLM.DeepSeekAPIBase = v
	}
	if v := os.Getenv("FRONTEND_URL"); v != "" {
		cfg.CORS.FrontendURL = v
	}
}
