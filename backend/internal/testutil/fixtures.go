package testutil

import (
	"time"

	"github.com/chat-note/backend/internal/models"
)

// Test password hashes (bcrypt hash of "password123")
const TestPasswordHash = "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qO.1BoWBPfGK.K"

// FixtureUser returns a user fixture for testing.
func FixtureUser() *models.User {
	return &models.User{
		Email:        "test@example.com",
		PasswordHash: TestPasswordHash,
	}
}

// FixtureUserWithEmail returns a user fixture with a specific email.
func FixtureUserWithEmail(email string) *models.User {
	return &models.User{
		Email:        email,
		PasswordHash: TestPasswordHash,
	}
}

// FixtureConversation returns a conversation fixture for testing.
func FixtureConversation(userID uint) *models.Conversation {
	return &models.Conversation{
		UserID: userID,
		Title:  "Test Conversation",
	}
}

// FixtureNote returns a note fixture for testing.
func FixtureNote(userID uint) *models.Note {
	return &models.Note{
		UserID:  userID,
		Title:   "Test Note",
		Content: "# Test Content\n\nThis is a test note.",
	}
}

// FixtureNoteWithTitle returns a note fixture with a specific title.
func FixtureNoteWithTitle(userID uint, title string) *models.Note {
	return &models.Note{
		UserID:  userID,
		Title:   title,
		Content: "Content for " + title,
	}
}

// FixtureFolder returns a folder fixture for testing.
func FixtureFolder(userID uint) *models.Folder {
	return &models.Folder{
		UserID: userID,
		Name:   "Test Folder",
	}
}

// FixtureFolderWithName returns a folder fixture with a specific name.
func FixtureFolderWithName(userID uint, name string) *models.Folder {
	return &models.Folder{
		UserID: userID,
		Name:   name,
	}
}

// FixtureProvider returns a provider fixture for testing.
func FixtureProvider(userID uint) *models.Provider {
	return &models.Provider{
		UserID:          userID,
		Name:            "Test Provider",
		Type:            models.ProviderCustom,
		APIBase:         "https://api.example.com/v1",
		APIKeyEncrypted: "enc:test-api-key",
	}
}

// FixtureProviderModel returns a provider model fixture for testing.
func FixtureProviderModel(providerID string) *models.ProviderModel {
	return &models.ProviderModel{
		ModelID:     "test-model",
		DisplayName: "Test Model",
		Enabled:     true,
	}
}

// FixtureRefreshToken returns a refresh token fixture for testing.
func FixtureRefreshToken(userID uint) *models.RefreshToken {
	return &models.RefreshToken{
		UserID:    userID,
		TokenHash: "rt_test-token-hash",
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}
}

// FixtureExpiredRefreshToken returns an expired refresh token fixture for testing.
func FixtureExpiredRefreshToken(userID uint) *models.RefreshToken {
	return &models.RefreshToken{
		UserID:    userID,
		TokenHash: "rt_expired-token-hash",
		ExpiresAt: time.Now().Add(-24 * time.Hour),
	}
}

// FixtureMessage returns a message fixture for testing.
func FixtureMessage(conversationID uint, role models.MessageRole, content string) *models.Message {
	return &models.Message{
		ConversationID: conversationID,
		Role:           role,
		Content:        content,
	}
}

// Common test constants
const (
	TestEmail         = "test@example.com"
	TestPassword      = "password123"
	TestWrongPassword = "wrongpassword"
	TestTitle         = "Test Title"
	TestContent       = "Test Content"
)
