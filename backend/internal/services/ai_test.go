package services

import (
	"context"
	"testing"

	"github.com/chat-note/backend/internal/testutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAIService_MockMode(t *testing.T) {
	cleanup := testutil.SetupTestDB(t)
	defer cleanup()

	service := NewAIService(true) // Mock mode enabled

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
		service := NewAIService(true)

		assert.NotNil(t, service)
		assert.True(t, service.mockEnabled)
	})

	t.Run("should create service without crypto", func(t *testing.T) {
		service := NewAIService(false)

		assert.NotNil(t, service)
		assert.Nil(t, service.aesCrypto)
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
		{
			name:    "JSON in code block with markdown content containing backticks",
			content: "```json\n{\"title\": \"Go Notes\", \"content\": \"## Code\\n\\n```go\\nfmt.Println(\\\"hi\\\")\\n```\\n\\nDone\", \"tags\": [\"go\"]}\n```",
			wantErr: false,
			expected: &GeneratedNote{
				Title:   "Go Notes",
				Content: "## Code\n\n```go\nfmt.Println(\"hi\")\n```\n\nDone",
				Tags:    []string{"go"},
			},
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
			expected: `{"key": "value"}`,
		},
		{
			name:     "JSON in plain code block",
			content:  "```\n{\"key\": \"value\"}\n```",
			expected: `{"key": "value"}`,
		},
		{
			name:     "JSON with markdown code blocks in content field",
			content:  "```json\n{\"title\": \"Test\", \"content\": \"some code:\\n```python\\nprint('hi')\\n```\\nmore text\", \"tags\": [\"go\"]}\n```",
			expected: "{\"title\": \"Test\", \"content\": \"some code:\\n```python\\nprint('hi')\\n```\\nmore text\", \"tags\": [\"go\"]}",
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
