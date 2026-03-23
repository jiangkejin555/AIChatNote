package crypto

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestHashPassword(t *testing.T) {
	tests := []struct {
		name     string
		password string
		wantErr  bool
	}{
		{
			name:     "normal password",
			password: "password123",
			wantErr:  false,
		},
		{
			name:     "empty password",
			password: "",
			wantErr:  false, // bcrypt allows empty passwords
		},
		{
			name:     "unicode password",
			password: "密码测试🔐",
			wantErr:  false,
		},
		{
			name:     "long password within limit",
			password: strings.Repeat("a", 70),
			wantErr:  false,
		},
		{
			name:     "password exceeds bcrypt limit",
			password: strings.Repeat("a", 100),
			wantErr:  true, // bcrypt has a 72 byte limit
		},
		{
			name:     "password with special characters",
			password: "!@#$%^&*()_+-=[]{}|;':\",./<>?",
			wantErr:  false,
		},
		{
			name:     "password exactly 72 bytes",
			password: strings.Repeat("a", 72),
			wantErr:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hash, err := HashPassword(tt.password)

			if tt.wantErr {
				require.Error(t, err)
				return
			}

			require.NoError(t, err)
			assert.NotEmpty(t, hash, "hash should not be empty")
			assert.True(t, len(hash) > 50, "bcrypt hash should be longer than 50 characters")
		})
	}
}

func TestCheckPassword(t *testing.T) {
	tests := []struct {
		name     string
		password string
		hash     string
		expected bool
	}{
		{
			name:     "correct password",
			password: "password123",
			hash:     func() string { h, _ := HashPassword("password123"); return h }(),
			expected: true,
		},
		{
			name:     "wrong password",
			password: "wrongpassword",
			hash:     func() string { h, _ := HashPassword("password123"); return h }(),
			expected: false,
		},
		{
			name:     "empty password against empty hash",
			password: "",
			hash:     func() string { h, _ := HashPassword(""); return h }(),
			expected: true,
		},
		{
			name:     "empty password against non-empty hash",
			password: "",
			hash:     func() string { h, _ := HashPassword("password123"); return h }(),
			expected: false,
		},
		{
			name:     "case sensitive password",
			password: "Password123",
			hash:     func() string { h, _ := HashPassword("password123"); return h }(),
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := CheckPassword(tt.password, tt.hash)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestHashPassword_DifferentSalt(t *testing.T) {
	password := "samepassword123"

	hash1, err := HashPassword(password)
	require.NoError(t, err)

	hash2, err := HashPassword(password)
	require.NoError(t, err)

	// Same password should produce different hashes due to salt
	assert.NotEqual(t, hash1, hash2, "same password should produce different hashes")

	// But both should verify correctly
	assert.True(t, CheckPassword(password, hash1))
	assert.True(t, CheckPassword(password, hash2))
}

func TestCheckPassword_InvalidHash(t *testing.T) {
	tests := []struct {
		name     string
		password string
		hash     string
		expected bool
	}{
		{
			name:     "invalid hash format",
			password: "password",
			hash:     "invalid-hash",
			expected: false,
		},
		{
			name:     "empty hash",
			password: "password",
			hash:     "",
			expected: false,
		},
		{
			name:     "corrupted hash",
			password: "password",
			hash:     "$2a$12$corruptedhash",
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := CheckPassword(tt.password, tt.hash)
			assert.Equal(t, tt.expected, result)
		})
	}
}
