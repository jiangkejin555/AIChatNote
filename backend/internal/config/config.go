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
	Context        ContextConfig        `yaml:"context"`
	OAuth          OAuthConfig          `yaml:"oauth"`
	SMTP           SMTPConfig           `yaml:"smtp"`
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

// ContextConfig defines conversation context processing settings
type ContextConfig struct {
	DefaultMode  string                `yaml:"default_mode"`  // summary | simple
	DefaultLevel string                `yaml:"default_level"` // short | normal | long
	Summary      ContextSummaryConfig  `yaml:"summary"`
	Simple       ContextSimpleConfig   `yaml:"simple"`
}

// ContextSummaryConfig holds parameters for summary mode
type ContextSummaryConfig struct {
	Short     ContextSummaryParams `yaml:"short"`
	Normal    ContextSummaryParams `yaml:"normal"`
	Long      ContextSummaryParams `yaml:"long"`
	MaxTokens int                  `yaml:"max_tokens"`
}

// ContextSummaryParams holds individual level parameters for summary mode
type ContextSummaryParams struct {
	WindowAutoSize  int `yaml:"window_auto_size"`
	KeepRecentCount int `yaml:"keep_recent_count"`
}

// ContextSimpleConfig holds parameters for simple mode
type ContextSimpleConfig struct {
	Short  ContextSimpleParams `yaml:"short"`
	Normal ContextSimpleParams `yaml:"normal"`
	Long   ContextSimpleParams `yaml:"long"`
}

// ContextSimpleParams holds individual level parameters for simple mode
type ContextSimpleParams struct {
	HistoryLimit int `yaml:"history_limit"`
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

	// Set default values for context config
	setContextDefaults(&cfg)

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

	// OAuth environment variables
	// Google OAuth
	if v := os.Getenv("GOOGLE_CLIENT_ID"); v != "" {
		cfg.OAuth.Google.ClientID = v
	}
	if v := os.Getenv("GOOGLE_CLIENT_SECRET"); v != "" {
		cfg.OAuth.Google.ClientSecret = v
	}
	if v := os.Getenv("GOOGLE_REDIRECT_URI"); v != "" {
		cfg.OAuth.Google.RedirectURI = v
	}
	if v := os.Getenv("GOOGLE_ENABLED"); v != "" {
		cfg.OAuth.Google.Enabled = strings.ToLower(v) == "true"
	}

	// GitHub OAuth
	if v := os.Getenv("GITHUB_CLIENT_ID"); v != "" {
		cfg.OAuth.GitHub.ClientID = v
	}
	if v := os.Getenv("GITHUB_CLIENT_SECRET"); v != "" {
		cfg.OAuth.GitHub.ClientSecret = v
	}
	if v := os.Getenv("GITHUB_REDIRECT_URI"); v != "" {
		cfg.OAuth.GitHub.RedirectURI = v
	}
	if v := os.Getenv("GITHUB_ENABLED"); v != "" {
		cfg.OAuth.GitHub.Enabled = strings.ToLower(v) == "true"
	}

	// QQ OAuth (uses APP_ID and APP_KEY instead of CLIENT_ID and CLIENT_SECRET)
	if v := os.Getenv("QQ_APP_ID"); v != "" {
		cfg.OAuth.QQ.ClientID = v
	}
	if v := os.Getenv("QQ_APP_KEY"); v != "" {
		cfg.OAuth.QQ.ClientSecret = v
	}
	if v := os.Getenv("QQ_REDIRECT_URI"); v != "" {
		cfg.OAuth.QQ.RedirectURI = v
	}
	if v := os.Getenv("QQ_ENABLED"); v != "" {
		cfg.OAuth.QQ.Enabled = strings.ToLower(v) == "true"
	}

	// SMTP configuration
	if v := os.Getenv("SMTP_HOST"); v != "" {
		cfg.SMTP.Host = v
	}
	if v := os.Getenv("SMTP_PORT"); v != "" {
		cfg.SMTP.Port = parseInt(v, cfg.SMTP.Port)
	}
	if v := os.Getenv("SMTP_USERNAME"); v != "" {
		cfg.SMTP.Username = v
	}
	if v := os.Getenv("SMTP_PASSWORD"); v != "" {
		cfg.SMTP.Password = v
	}
	if v := os.Getenv("SMTP_FROM"); v != "" {
		cfg.SMTP.From = v
	}
	if v := os.Getenv("SMTP_FROM_NAME"); v != "" {
		cfg.SMTP.FromName = v
	}
	if v := os.Getenv("SMTP_USE_TLS"); v != "" {
		cfg.SMTP.UseTLS = strings.ToLower(v) == "true"
	}
	if v := os.Getenv("SMTP_ENABLED"); v != "" {
		cfg.SMTP.Enabled = strings.ToLower(v) == "true"
	}
}

func parseInt(s string, defaultValue int) int {
	if v, err := strconv.Atoi(s); err == nil {
		return v
	}
	return defaultValue
}

// setContextDefaults sets default values for context configuration
func setContextDefaults(cfg *Config) {
	// Set default mode and level if not specified
	if cfg.Context.DefaultMode == "" {
		cfg.Context.DefaultMode = "simple"
	}
	if cfg.Context.DefaultLevel == "" {
		cfg.Context.DefaultLevel = "normal"
	}

	// Set default summary mode parameters if not specified
	if cfg.Context.Summary.MaxTokens == 0 {
		cfg.Context.Summary.MaxTokens = 300
	}

	// Set default summary params for each level
	if cfg.Context.Summary.Short.WindowAutoSize == 0 {
		cfg.Context.Summary.Short = ContextSummaryParams{
			WindowAutoSize:  10,
			KeepRecentCount: 5,
		}
	}
	if cfg.Context.Summary.Normal.WindowAutoSize == 0 {
		cfg.Context.Summary.Normal = ContextSummaryParams{
			WindowAutoSize:  20,
			KeepRecentCount: 10,
		}
	}
	if cfg.Context.Summary.Long.WindowAutoSize == 0 {
		cfg.Context.Summary.Long = ContextSummaryParams{
			WindowAutoSize:  40,
			KeepRecentCount: 20,
		}
	}

	// Set default simple mode params for each level
	if cfg.Context.Simple.Short.HistoryLimit == 0 {
		cfg.Context.Simple.Short = ContextSimpleParams{HistoryLimit: 5}
	}
	if cfg.Context.Simple.Normal.HistoryLimit == 0 {
		cfg.Context.Simple.Normal = ContextSimpleParams{HistoryLimit: 10}
	}
	if cfg.Context.Simple.Long.HistoryLimit == 0 {
		cfg.Context.Simple.Long = ContextSimpleParams{HistoryLimit: 15}
	}
}
