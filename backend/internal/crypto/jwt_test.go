package crypto

import (
	"testing"
	"time"

	"github.com/chat-note/backend/internal/config"
	"github.com/chat-note/backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func testJWTConfig() *config.Config {
	return &config.Config{
		JWT: config.JWTConfig{
			Secret:        "test-secret-key-for-unit-testing",
			RefreshSecret: "test-refresh-secret-key",
			Expiry:        time.Hour,
			RefreshExpiry: 24 * time.Hour,
		},
	}
}

func TestJWTService_GenerateToken(t *testing.T) {
	cfg := testJWTConfig()
	service := NewJWTService(cfg)

	tests := []struct {
		name    string
		user    *models.User
		wantErr bool
	}{
		{
			name: "valid user",
			user: &models.User{
				ID:    1,
				Email: "test@example.com",
			},
			wantErr: false,
		},
		{
			name: "user with large ID",
			user: &models.User{
				ID:    999999999,
				Email: "large@example.com",
			},
			wantErr: false,
		},
		{
			name: "user with unicode email",
			user: &models.User{
				ID:    2,
				Email: "测试@example.com",
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			token, err := service.GenerateToken(tt.user)

			if tt.wantErr {
				require.Error(t, err)
				return
			}

			require.NoError(t, err)
			assert.NotEmpty(t, token, "token should not be empty")
			assert.True(t, len(token) > 50, "JWT token should be reasonably long")
		})
	}
}

func TestJWTService_ValidateToken(t *testing.T) {
	cfg := testJWTConfig()
	service := NewJWTService(cfg)

	tests := []struct {
		name       string
		setupToken func() string
		wantErr    bool
		checkUser  func(t *testing.T, claims *Claims)
	}{
		{
			name: "valid token",
			setupToken: func() string {
				user := &models.User{ID: 1, Email: "test@example.com"}
				token, _ := service.GenerateToken(user)
				return token
			},
			wantErr: false,
			checkUser: func(t *testing.T, claims *Claims) {
				assert.Equal(t, uint(1), claims.UserID)
				assert.Equal(t, "test@example.com", claims.Email)
			},
		},
		{
			name: "invalid token format",
			setupToken: func() string {
				return "invalid-token"
			},
			wantErr: true,
		},
		{
			name: "empty token",
			setupToken: func() string {
				return ""
			},
			wantErr: true,
		},
		{
			name: "token with wrong secret",
			setupToken: func() string {
				wrongCfg := &config.Config{
					JWT: config.JWTConfig{
						Secret: "wrong-secret-key",
						Expiry: time.Hour,
					},
				}
				wrongService := NewJWTService(wrongCfg)
				user := &models.User{ID: 1, Email: "test@example.com"}
				token, _ := wrongService.GenerateToken(user)
				return token
			},
			wantErr: true,
		},
		{
			name: "malformed token",
			setupToken: func() string {
				return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature"
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			token := tt.setupToken()
			claims, err := service.ValidateToken(token)

			if tt.wantErr {
				require.Error(t, err)
				return
			}

			require.NoError(t, err)
			require.NotNil(t, claims)
			if tt.checkUser != nil {
				tt.checkUser(t, claims)
			}
		})
	}
}

func TestJWTService_GenerateRefreshToken(t *testing.T) {
	cfg := testJWTConfig()
	service := NewJWTService(cfg)

	token, expiresAt, err := service.GenerateRefreshToken()

	require.NoError(t, err)
	assert.NotEmpty(t, token, "refresh token should not be empty")
	assert.True(t, len(token) > 10, "refresh token should have reasonable length")
	assert.True(t, expiresAt.After(time.Now()), "expiry should be in the future")
	assert.True(t, token[:3] == "rt_", "refresh token should start with 'rt_'")
}

func TestJWTService_ValidateRefreshToken(t *testing.T) {
	cfg := testJWTConfig()
	service := NewJWTService(cfg)

	tests := []struct {
		name      string
		expiresAt time.Time
		expected  bool
	}{
		{
			name:      "valid refresh token",
			expiresAt: time.Now().Add(24 * time.Hour),
			expected:  true,
		},
		{
			name:      "expired refresh token",
			expiresAt: time.Now().Add(-1 * time.Hour),
			expected:  false,
		},
		{
			name:      "token expiring now",
			expiresAt: time.Now(),
			expected:  false,
		},
		{
			name:      "token expiring in 1 second",
			expiresAt: time.Now().Add(1 * time.Second),
			expected:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := service.ValidateRefreshToken(tt.expiresAt)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestJWTService_TokenContainsCorrectClaims(t *testing.T) {
	cfg := testJWTConfig()
	service := NewJWTService(cfg)

	user := &models.User{
		ID:    42,
		Email: "claims@example.com",
	}

	token, err := service.GenerateToken(user)
	require.NoError(t, err)

	claims, err := service.ValidateToken(token)
	require.NoError(t, err)

	// Verify all claims
	assert.Equal(t, user.ID, claims.UserID)
	assert.Equal(t, user.Email, claims.Email)
	assert.NotZero(t, claims.ExpiresAt)
	assert.NotZero(t, claims.IssuedAt)
	assert.NotZero(t, claims.NotBefore)
}
