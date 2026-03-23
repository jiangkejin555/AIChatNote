package services

import (
	"context"
	"testing"

	"github.com/ai-chat-notes/backend/internal/config"
	"github.com/ai-chat-notes/backend/internal/testutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAIService_MockMode(t *testing.T) {
	cleanup := testutil.SetupTestDB(t)
	defer cleanup()

	cfg := &config.NoteLLMConfig{}
	service := NewAIService(cfg, true) // Mock mode enabled

	t.Run("should return mock note when mock mode is enabled", func(t *testing.T) {
		user := testutil.CreateTestUser(t, "ai_test@example.com", "hash")
		conv := testutil.CreateTestConversation(t, user.ID, "Test Conversation")

		note, err := service.GenerateNoteFromConversation(context.Background(), conv.ID, user.ID)

		require.NoError(t, err)
		assert.NotNil(t, note)
		assert.Contains(t, note.Title, "Mock")
		assert.NotEmpty(t, note.Content)
		assert.NotEmpty(t, note.Tags)
	})

	// Note: Mock mode returns mock data without validation
	// Real mode tests would require actual API calls
	t.Run("should return mock data even for non-existent conversation in mock mode", func(t *testing.T) {
		user := testutil.CreateTestUser(t, "ai_test2@example.com", "hash")

		note, err := service.GenerateNoteFromConversation(context.Background(), 99999, user.ID)

		// Mock mode returns data without validation
		require.NoError(t, err)
		assert.NotNil(t, note)
	})
}

func TestAIService_NewAIService(t *testing.T) {
	t.Run("should create service in mock mode", func(t *testing.T) {
		cfg := &config.NoteLLMConfig{}
		service := NewAIService(cfg, true)

		assert.NotNil(t, service)
		assert.True(t, service.mockEnabled)
	})

	t.Run("should create service without client when no API key", func(t *testing.T) {
		cfg := &config.NoteLLMConfig{
			DeepSeekAPIKey: "",
		}
		service := NewAIService(cfg, false)

		assert.NotNil(t, service)
		assert.Nil(t, service.client)
	})
}

func TestParseAIResponse(t *testing.T) {
	tests := []struct {
		name     string
		content  string
		wantErr  bool
		expected *GeneratedNote
	}{
		{
			name:    "valid JSON",
			content: `{"title": "Test Title", "content": "Test content", "tags": ["tag1", "tag2"]}`,
			wantErr: false,
			expected: &GeneratedNote{
				Title:   "Test Title",
				Content: "Test content",
				Tags:    []string{"tag1", "tag2"},
			},
		},
		{
			name:     "JSON in code block",
			content:  "```json\n{\"title\": \"Test\", \"content\": \"Content\", \"tags\": []}\n```",
			wantErr:  false,
			expected: &GeneratedNote{Title: "Test", Content: "Content", Tags: []string{}},
		},
		{
			name:    "invalid JSON",
			content: "not a valid json",
			wantErr: true,
		},
		{
			name:    "empty string",
			content: "",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			note, err := parseAIResponse(tt.content)

			if tt.wantErr {
				assert.Error(t, err)
				assert.Nil(t, note)
			} else {
				require.NoError(t, err)
				require.NotNil(t, note)
				assert.Equal(t, tt.expected.Title, note.Title)
				assert.Equal(t, tt.expected.Content, note.Content)
				assert.Equal(t, tt.expected.Tags, note.Tags)
			}
		})
	}
}

func TestExtractJSON(t *testing.T) {
	tests := []struct {
		name     string
		content  string
		expected string
	}{
		{
			name:     "plain JSON",
			content:  `{"key": "value"}`,
			expected: `{"key": "value"}`,
		},
		{
			name:     "JSON in json code block",
			content:  "```json\n{\"key\": \"value\"}\n```",
			expected: "\n{\"key\": \"value\"}\n",
		},
		{
			name:     "JSON in plain code block",
			content:  "```\n{\"key\": \"value\"}\n```",
			expected: "\n{\"key\": \"value\"}\n",
		},
		{
			name:     "no code block",
			content:  "plain text",
			expected: "plain text",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := extractJSON(tt.content)
			assert.Equal(t, tt.expected, result)
		})
	}
}
