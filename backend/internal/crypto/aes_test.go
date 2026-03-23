package crypto

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNewAESCrypto(t *testing.T) {
	tests := []struct {
		name    string
		key     string
		wantErr bool
	}{
		{
			name:    "valid 32 byte key",
			key:     "12345678901234567890123456789012",
			wantErr: false,
		},
		{
			name:    "short key gets padded",
			key:     "short",
			wantErr: false,
		},
		{
			name:    "long key gets truncated",
			key:     strings.Repeat("a", 64),
			wantErr: false,
		},
		{
			name:    "empty key gets padded",
			key:     "",
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			crypto, err := NewAESCrypto(tt.key)

			if tt.wantErr {
				require.Error(t, err)
				return
			}

			require.NoError(t, err)
			require.NotNil(t, crypto)
		})
	}
}

func TestAESCrypto_Encrypt(t *testing.T) {
	crypto, err := NewAESCrypto("test-encryption-key-32-bytes!!")
	require.NoError(t, err)

	tests := []struct {
		name      string
		plaintext string
		wantErr   bool
	}{
		{
			name:      "normal text",
			plaintext: "my secret api key",
			wantErr:   false,
		},
		{
			name:      "empty string",
			plaintext: "",
			wantErr:   false,
		},
		{
			name:      "unicode text",
			plaintext: "中文密钥 🔐",
			wantErr:   false,
		},
		{
			name:      "long text",
			plaintext: strings.Repeat("a", 1000),
			wantErr:   false,
		},
		{
			name:      "json text",
			plaintext: `{"key": "value", "number": 123}`,
			wantErr:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ciphertext, err := crypto.Encrypt(tt.plaintext)

			if tt.wantErr {
				require.Error(t, err)
				return
			}

			require.NoError(t, err)

			if tt.plaintext == "" {
				assert.Equal(t, "", ciphertext)
			} else {
				assert.True(t, len(ciphertext) > 4, "ciphertext should be longer than prefix")
				assert.True(t, strings.HasPrefix(ciphertext, "enc:"), "ciphertext should start with 'enc:'")
			}
		})
	}
}

func TestAESCrypto_Decrypt(t *testing.T) {
	crypto, err := NewAESCrypto("test-encryption-key-32-bytes!!")
	require.NoError(t, err)

	tests := []struct {
		name       string
		setupText  func() string
		wantErr    bool
		wantResult string
	}{
		{
			name: "normal decryption",
			setupText: func() string {
				ct, _ := crypto.Encrypt("my secret")
				return ct
			},
			wantErr:    false,
			wantResult: "my secret",
		},
		{
			name: "empty string",
			setupText: func() string {
				return ""
			},
			wantErr:    false,
			wantResult: "",
		},
		{
			name: "no prefix (backward compatibility)",
			setupText: func() string {
				return "plaintext"
			},
			wantErr:    false,
			wantResult: "plaintext",
		},
		{
			name: "invalid base64",
			setupText: func() string {
				return "enc:not-valid-base64!!!"
			},
			wantErr: true,
		},
		{
			name: "ciphertext too short",
			setupText: func() string {
				return "enc:YWJj" // "abc" in base64, too short for nonce
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ciphertext := tt.setupText()
			plaintext, err := crypto.Decrypt(ciphertext)

			if tt.wantErr {
				require.Error(t, err)
				return
			}

			require.NoError(t, err)
			assert.Equal(t, tt.wantResult, plaintext)
		})
	}
}

func TestAESCrypto_EncryptDecrypt_RoundTrip(t *testing.T) {
	crypto, err := NewAESCrypto("test-encryption-key-32-bytes!!")
	require.NoError(t, err)

	tests := []struct {
		name      string
		plaintext string
	}{
		{"simple text", "hello world"},
		{"empty string", ""},
		{"unicode", "你好世界 🌍"},
		{"json", `{"key": "value"}`},
		{"special chars", "!@#$%^&*()"},
		{"long text", strings.Repeat("x", 500)},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ciphertext, err := crypto.Encrypt(tt.plaintext)
			require.NoError(t, err)

			plaintext, err := crypto.Decrypt(ciphertext)
			require.NoError(t, err)

			assert.Equal(t, tt.plaintext, plaintext)
		})
	}
}

func TestAESCrypto_DifferentCiphertext(t *testing.T) {
	crypto, err := NewAESCrypto("test-encryption-key-32-bytes!!")
	require.NoError(t, err)

	plaintext := "same plaintext"

	ciphertext1, err := crypto.Encrypt(plaintext)
	require.NoError(t, err)

	ciphertext2, err := crypto.Encrypt(plaintext)
	require.NoError(t, err)

	// Due to random nonce, same plaintext should produce different ciphertext
	assert.NotEqual(t, ciphertext1, ciphertext2, "same plaintext should produce different ciphertext")

	// But both should decrypt to the same value
	decrypted1, err := crypto.Decrypt(ciphertext1)
	require.NoError(t, err)
	decrypted2, err := crypto.Decrypt(ciphertext2)
	require.NoError(t, err)

	assert.Equal(t, plaintext, decrypted1)
	assert.Equal(t, plaintext, decrypted2)
}

func TestAESCrypto_DifferentKeyDecryptionFails(t *testing.T) {
	crypto1, err := NewAESCrypto("first-encryption-key-32-bytes!")
	require.NoError(t, err)

	crypto2, err := NewAESCrypto("second-encryption-key-32-byte")
	require.NoError(t, err)

	plaintext := "secret message"

	ciphertext, err := crypto1.Encrypt(plaintext)
	require.NoError(t, err)

	// Decrypting with different key should fail
	_, err = crypto2.Decrypt(ciphertext)
	require.Error(t, err, "decryption with wrong key should fail")
}
