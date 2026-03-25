package config

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Server         ServerConfig         `yaml:"server"`
	Database       DatabaseConfig       `yaml:"database"`
	JWT            JWTConfig            `yaml:"jwt"`
	Encryption     EncryptionConfig     `yaml:"encryption"`
	CORS           CORSConfig           `yaml:"cors"`
	Mock           MockConfig           `yaml:"mock"`
	TitleGenerator TitleGeneratorConfig `yaml:"title_generator"`
}

type ServerConfig struct {
	Port    string `yaml:"port"`
	GinMode string `yaml:"gin_mode"`
}

type DatabaseConfig struct {
	Host            string `yaml:"host"`
	Port            int    `yaml:"port"`
	User            string `yaml:"user"`
	Password        string `yaml:"password"`
	DBName          string `yaml:"dbname"`
	SSLMode         string `yaml:"sslmode"`
	MaxOpenConns    int    `yaml:"max_open_conns"`
	MaxIdleConns    int    `yaml:"max_idle_conns"`
	ConnMaxLifetime int    `yaml:"conn_max_lifetime"` // seconds
}

type JWTConfig struct {
	Secret             string `yaml:"secret"`
	RefreshSecret      string `yaml:"refresh_secret"`
	ExpiryHours        int    `yaml:"expiry_hours"`
	RefreshExpiryHours int    `yaml:"refresh_expiry_hours"`

	// Computed values
	Expiry        time.Duration `yaml:"-"`
	RefreshExpiry time.Duration `yaml:"-"`
}

type EncryptionConfig struct {
	Key string `yaml:"key"`
}

type CORSConfig struct {
	FrontendURL string `yaml:"frontend_url"`
}

type MockConfig struct {
	Enabled bool `yaml:"enabled"`
}

type TitleGeneratorConfig struct {
	Enabled   bool   `yaml:"enabled"`
	APIBase   string `yaml:"api_base"`
	APIKey    string `yaml:"api_key"`
	Model     string `yaml:"model"`
	MaxTokens int    `yaml:"max_tokens"`
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

	// Set default values for title generator
	if cfg.TitleGenerator.MaxTokens == 0 {
		cfg.TitleGenerator.MaxTokens = 50
	}

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
	if v := os.Getenv("DB_HOST"); v != "" {
		cfg.Database.Host = v
	}
	if v := os.Getenv("DB_PORT"); v != "" {
		cfg.Database.Port = parseInt(v, cfg.Database.Port)
	}
	if v := os.Getenv("DB_USER"); v != "" {
		cfg.Database.User = v
	}
	if v := os.Getenv("DB_PASSWORD"); v != "" {
		cfg.Database.Password = v
	}
	if v := os.Getenv("DB_NAME"); v != "" {
		cfg.Database.DBName = v
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
	if v := os.Getenv("FRONTEND_URL"); v != "" {
		cfg.CORS.FrontendURL = v
	}
	if v := os.Getenv("MOCK_ENABLED"); v != "" {
		cfg.Mock.Enabled = strings.ToLower(v) == "true"
	}
	if v := os.Getenv("TITLE_GENERATOR_ENABLED"); v != "" {
		cfg.TitleGenerator.Enabled = strings.ToLower(v) == "true"
	}
	if v := os.Getenv("TITLE_GENERATOR_API_BASE"); v != "" {
		cfg.TitleGenerator.APIBase = v
	}
	if v := os.Getenv("TITLE_GENERATOR_API_KEY"); v != "" {
		cfg.TitleGenerator.APIKey = v
	}
	if v := os.Getenv("TITLE_GENERATOR_MODEL"); v != "" {
		cfg.TitleGenerator.Model = v
	}
	if v := os.Getenv("TITLE_GENERATOR_MAX_TOKENS"); v != "" {
		cfg.TitleGenerator.MaxTokens = parseInt(v, cfg.TitleGenerator.MaxTokens)
	}
}

func parseInt(s string, defaultValue int) int {
	if v, err := strconv.Atoi(s); err == nil {
		return v
	}
	return defaultValue
}
