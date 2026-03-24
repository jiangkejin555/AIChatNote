package testutil

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/chat-note/backend/internal/config"
	"github.com/chat-note/backend/internal/crypto"
	"github.com/chat-note/backend/internal/database"
	"github.com/chat-note/backend/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// SetupTestDB creates an in-memory SQLite database for testing.
// Returns a cleanup function that must be called after the test.
func SetupTestDB(t *testing.T) func() {
	t.Helper()

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger:                                   logger.Default.LogMode(logger.Silent),
		DisableForeignKeyConstraintWhenMigrating: true,
	})
	if err != nil {
		t.Fatalf("failed to connect test database: %v", err)
	}

	// Manually create tables with SQLite-compatible schema
	sqlDB, _ := db.DB()
	tables := []string{
		`CREATE TABLE users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			email VARCHAR(255) UNIQUE NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			created_at DATETIME,
			updated_at DATETIME
		)`,
		`CREATE TABLE refresh_tokens (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			token_hash VARCHAR(255) UNIQUE NOT NULL,
			expires_at DATETIME NOT NULL,
			created_at DATETIME
		)`,
		`CREATE TABLE providers (
			id TEXT PRIMARY KEY,
			user_id INTEGER NOT NULL,
			name VARCHAR(255) NOT NULL,
			type VARCHAR(50) NOT NULL,
			api_base VARCHAR(500) NOT NULL,
			api_key_encrypted TEXT,
			created_at DATETIME,
			updated_at DATETIME
		)`,
		`CREATE TABLE provider_models (
			id TEXT PRIMARY KEY,
			provider_id TEXT NOT NULL,
			model_id VARCHAR(255) NOT NULL,
			display_name VARCHAR(255) NOT NULL,
			is_default BOOLEAN DEFAULT FALSE,
			enabled BOOLEAN DEFAULT TRUE,
			created_at DATETIME,
			updated_at DATETIME
		)`,
		`CREATE TABLE conversations (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			provider_model_id TEXT,
			model_id VARCHAR(255),
			title VARCHAR(500),
			is_saved BOOLEAN DEFAULT FALSE,
			created_at DATETIME,
			updated_at DATETIME
		)`,
		`CREATE TABLE messages (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			conversation_id INTEGER NOT NULL,
			role VARCHAR(20) NOT NULL,
			content TEXT NOT NULL,
			created_at DATETIME
		)`,
		`CREATE TABLE folders (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			name VARCHAR(255) NOT NULL,
			parent_id INTEGER,
			created_at DATETIME,
			updated_at DATETIME
		)`,
		`CREATE TABLE notes (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_id INTEGER NOT NULL,
			folder_id INTEGER,
			source_conversation_id INTEGER,
			title VARCHAR(500) NOT NULL,
			content TEXT NOT NULL,
			created_at DATETIME,
			updated_at DATETIME
		)`,
		`CREATE TABLE note_tags (
			note_id INTEGER NOT NULL,
			tag VARCHAR(100) NOT NULL,
			created_at DATETIME,
			PRIMARY KEY (note_id, tag)
		)`,
	}

	for _, table := range tables {
		_, err := sqlDB.Exec(table)
		if err != nil {
			t.Fatalf("failed to create test table: %v", err)
		}
	}

	// Replace global database
	originalDB := database.DB
	database.DB = db

	// Return cleanup function
	return func() {
		sqlDB, _ := db.DB()
		sqlDB.Close()
		database.DB = originalDB
	}
}

// SetupTestRouter creates a Gin router in test mode.
func SetupTestRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	return router
}

// TestConfig returns a test configuration with reasonable defaults.
func TestConfig() *config.Config {
	return &config.Config{
		JWT: config.JWTConfig{
			Secret:             "test-secret-key-for-unit-testing",
			RefreshSecret:      "test-refresh-secret-key",
			ExpiryHours:        1,
			RefreshExpiryHours: 24,
			Expiry:             time.Hour,
			RefreshExpiry:      24 * time.Hour,
		},
		Encryption: config.EncryptionConfig{
			Key: "test-encryption-key-32-bytes!!",
		},
		Mock: config.MockConfig{
			Enabled: true,
		},
	}
}

// MakeRequest creates an HTTP request for testing.
// body can be:
//   - string: treated as raw JSON string (e.g., `{"key": "value"}`)
//   - []byte: treated as raw body bytes
//   - other types: marshaled to JSON
func MakeRequest(router *gin.Engine, method, path string, body interface{}) *httptest.ResponseRecorder {
	var bodyReader io.Reader
	if body != nil {
		switch v := body.(type) {
		case string:
			bodyReader = strings.NewReader(v)
		case []byte:
			bodyReader = bytes.NewReader(v)
		default:
			jsonBody, _ := json.Marshal(body)
			bodyReader = bytes.NewReader(jsonBody)
		}
	}

	req := httptest.NewRequest(method, path, bodyReader)
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	return w
}

// MakeAuthenticatedRequest creates an HTTP request with JWT authentication.
// body can be:
//   - string: treated as raw JSON string (e.g., `{"key": "value"}`)
//   - []byte: treated as raw body bytes
//   - other types: marshaled to JSON
func MakeAuthenticatedRequest(router *gin.Engine, method, path string, body interface{}, userID uint, cfg *config.Config) *httptest.ResponseRecorder {
	var bodyReader io.Reader
	if body != nil {
		switch v := body.(type) {
		case string:
			bodyReader = strings.NewReader(v)
		case []byte:
			bodyReader = bytes.NewReader(v)
		default:
			jsonBody, _ := json.Marshal(body)
			bodyReader = bytes.NewReader(jsonBody)
		}
	}

	req := httptest.NewRequest(method, path, bodyReader)
	req.Header.Set("Content-Type", "application/json")

	// Generate JWT token
	if cfg == nil {
		cfg = TestConfig()
	}
	jwtService := crypto.NewJWTService(cfg)
	user := &models.User{ID: userID, Email: "test@example.com"}
	token, err := jwtService.GenerateToken(user)
	if err != nil {
		panic("failed to generate test token: " + err.Error())
	}
	req.Header.Set("Authorization", "Bearer "+token)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	return w
}

// MakeAuthenticatedRequestWithToken creates an HTTP request with a specific token.
// body can be:
//   - string: treated as raw JSON string (e.g., `{"key": "value"}`)
//   - []byte: treated as raw body bytes
//   - other types: marshaled to JSON
func MakeAuthenticatedRequestWithToken(router *gin.Engine, method, path string, body interface{}, token string) *httptest.ResponseRecorder {
	var bodyReader io.Reader
	if body != nil {
		switch v := body.(type) {
		case string:
			bodyReader = strings.NewReader(v)
		case []byte:
			bodyReader = bytes.NewReader(v)
		default:
			jsonBody, _ := json.Marshal(body)
			bodyReader = bytes.NewReader(jsonBody)
		}
	}

	req := httptest.NewRequest(method, path, bodyReader)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	return w
}

// CreateTestUser creates a test user and returns it.
func CreateTestUser(t *testing.T, email, passwordHash string) *models.User {
	t.Helper()

	user := &models.User{
		Email:        email,
		PasswordHash: passwordHash,
	}
	if err := database.DB.Create(user).Error; err != nil {
		t.Fatalf("failed to create test user: %v", err)
	}
	return user
}

// CreateTestConversation creates a test conversation and returns it.
func CreateTestConversation(t *testing.T, userID uint, title string) *models.Conversation {
	t.Helper()

	conv := &models.Conversation{
		UserID: userID,
		Title:  title,
	}
	if err := database.DB.Create(conv).Error; err != nil {
		t.Fatalf("failed to create test conversation: %v", err)
	}
	return conv
}

// CreateTestConversationWithModel creates a test conversation with a provider model.
func CreateTestConversationWithModel(t *testing.T, userID uint, title string, modelID uuid.UUID) *models.Conversation {
	t.Helper()

	conv := &models.Conversation{
		UserID:          userID,
		Title:           title,
		ProviderModelID: &modelID,
	}
	if err := database.DB.Create(conv).Error; err != nil {
		t.Fatalf("failed to create test conversation: %v", err)
	}
	return conv
}

// CreateTestConversationWithModelID creates a test conversation with both provider_model_id and model_id snapshot.
func CreateTestConversationWithModelID(t *testing.T, userID uint, title string, providerModelID uuid.UUID, modelID string) *models.Conversation {
	t.Helper()

	conv := &models.Conversation{
		UserID:          userID,
		Title:           title,
		ProviderModelID: &providerModelID,
		ModelID:         modelID,
	}
	if err := database.DB.Create(conv).Error; err != nil {
		t.Fatalf("failed to create test conversation: %v", err)
	}
	return conv
}

// CreateTestMessage creates a test message and returns it.
func CreateTestMessage(t *testing.T, conversationID uint, role models.MessageRole, content string) *models.Message {
	t.Helper()

	msg := &models.Message{
		ConversationID: conversationID,
		Role:           role,
		Content:        content,
	}
	if err := database.DB.Create(msg).Error; err != nil {
		t.Fatalf("failed to create test message: %v", err)
	}
	return msg
}

// CreateTestNote creates a test note and returns it.
func CreateTestNote(t *testing.T, userID uint, title, content string) *models.Note {
	t.Helper()

	note := &models.Note{
		UserID:  userID,
		Title:   title,
		Content: content,
	}
	if err := database.DB.Create(note).Error; err != nil {
		t.Fatalf("failed to create test note: %v", err)
	}
	return note
}

// CreateTestNoteWithFolder creates a test note in a specific folder.
func CreateTestNoteWithFolder(t *testing.T, userID uint, title, content string, folderID uint) *models.Note {
	t.Helper()

	note := &models.Note{
		UserID:   userID,
		Title:    title,
		Content:  content,
		FolderID: &folderID,
	}
	if err := database.DB.Create(note).Error; err != nil {
		t.Fatalf("failed to create test note: %v", err)
	}
	return note
}

// CreateTestFolder creates a test folder and returns it.
func CreateTestFolder(t *testing.T, userID uint, name string) *models.Folder {
	t.Helper()

	folder := &models.Folder{
		UserID: userID,
		Name:   name,
	}
	if err := database.DB.Create(folder).Error; err != nil {
		t.Fatalf("failed to create test folder: %v", err)
	}
	return folder
}

// CreateTestFolderWithParent creates a test folder with a parent.
func CreateTestFolderWithParent(t *testing.T, userID uint, name string, parentID uint) *models.Folder {
	t.Helper()

	folder := &models.Folder{
		UserID:   userID,
		Name:     name,
		ParentID: &parentID,
	}
	if err := database.DB.Create(folder).Error; err != nil {
		t.Fatalf("failed to create test folder: %v", err)
	}
	return folder
}

// CreateTestProvider creates a test provider and returns it.
func CreateTestProvider(t *testing.T, userID uint, name string, providerType models.ProviderType) *models.Provider {
	t.Helper()

	provider := &models.Provider{
		ID:              uuid.New(), // Must set manually for SQLite
		UserID:          userID,
		Name:            name,
		Type:            providerType,
		APIBase:         "https://api.example.com",
		APIKeyEncrypted: "enc:test-key",
	}
	if err := database.DB.Create(&provider).Error; err != nil {
		t.Fatalf("failed to create test provider: %v", err)
	}
	return provider
}

// CreateTestProviderModel creates a test provider model and returns it.
func CreateTestProviderModel(t *testing.T, providerID uuid.UUID, modelID, displayName string) *models.ProviderModel {
	t.Helper()

	model := &models.ProviderModel{
		ProviderID:  providerID,
		ModelID:     modelID,
		DisplayName: displayName,
		Enabled:     true,
	}
	if err := database.DB.Create(&model).Error; err != nil {
		t.Fatalf("failed to create test provider model: %v", err)
	}
	return model
}

// CreateTestRefreshToken creates a test refresh token and returns it.
func CreateTestRefreshToken(t *testing.T, userID uint, tokenHash string, expiresAt time.Time) *models.RefreshToken {
	t.Helper()

	rt := &models.RefreshToken{
		UserID:    userID,
		TokenHash: tokenHash,
		ExpiresAt: expiresAt,
	}
	if err := database.DB.Create(rt).Error; err != nil {
		t.Fatalf("failed to create test refresh token: %v", err)
	}
	return rt
}

// ParseJSONResponse parses a JSON response into a map.
func ParseJSONResponse(t *testing.T, w *httptest.ResponseRecorder) map[string]interface{} {
	t.Helper()

	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("failed to parse JSON response: %v", err)
	}
	return response
}

// AssertJSONContains asserts that a JSON response contains expected keys.
func AssertJSONContains(t *testing.T, response map[string]interface{}, keys ...string) {
	t.Helper()

	for _, key := range keys {
		if _, exists := response[key]; !exists {
			t.Errorf("expected JSON response to contain key '%s'", key)
		}
	}
}

// AssertError asserts that a JSON response contains an error.
func AssertError(t *testing.T, response map[string]interface{}) {
	t.Helper()

	if _, exists := response["error"]; !exists {
		t.Error("expected JSON response to contain 'error' key")
	}
}

// GenerateTestUUID generates a UUID for testing.
func GenerateTestUUID() uuid.UUID {
	return uuid.New()
}

// StringsToReader converts a string to an io.Reader.
func StringsToReader(s string) io.Reader {
	return strings.NewReader(s)
}
