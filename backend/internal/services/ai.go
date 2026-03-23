package services

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/ai-chat-notes/backend/internal/config"
	"github.com/ai-chat-notes/backend/internal/models"
	"github.com/ai-chat-notes/backend/internal/repository"
	"github.com/sashabaranov/go-openai"
)

type AIService struct {
	client   *openai.Client
	convRepo *repository.ConversationRepository
}

func NewAIService(cfg *config.NoteLLMConfig) *AIService {
	clientConfig := openai.DefaultConfig(cfg.DeepSeekAPIKey)
	clientConfig.BaseURL = cfg.DeepSeekAPIBase

	return &AIService{
		client:   openai.NewClientWithConfig(clientConfig),
		convRepo: repository.NewConversationRepository(),
	}
}

type GeneratedNote struct {
	Title   string   `json:"title"`
	Content string   `json:"content"`
	Tags    []string `json:"tags"`
}

// GenerateNoteFromConversation generates a note summary from a conversation
func (s *AIService) GenerateNoteFromConversation(ctx context.Context, convID, userID uint) (*GeneratedNote, error) {
	// Get conversation with messages
	conv, err := s.convRepo.FindByIDWithMessages(convID)
	if err != nil {
		return nil, fmt.Errorf("conversation not found: %w", err)
	}

	// Verify user owns the conversation
	if conv.UserID != userID {
		return nil, fmt.Errorf("unauthorized access to conversation")
	}

	// Build conversation text
	var conversationText string
	for _, msg := range conv.Messages {
		role := "User"
		if msg.Role == models.RoleAssistant {
			role = "Assistant"
		}
		conversationText += fmt.Sprintf("%s: %s\n\n", role, msg.Content)
	}

	// Build prompt for summary
	prompt := buildSummaryPrompt(conv.Title, conversationText)

	// Call DeepSeek API
	resp, err := s.client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: "deepseek-chat",
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: getSystemPrompt(),
			},
			{
				Role:    openai.ChatMessageRoleUser,
				Content: prompt,
			},
		},
		Temperature: 0.7,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to generate note: %w", err)
	}

	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("no response from AI")
	}

	// Parse JSON response
	content := resp.Choices[0].Message.Content
	note, err := parseAIResponse(content)
	if err != nil {
		// Fallback: return raw content as note
		return &GeneratedNote{
			Title:   conv.Title + " - Summary",
			Content: content,
			Tags:    []string{"AI-generated"},
		}, nil
	}

	return note, nil
}

func getSystemPrompt() string {
	return `You are an AI assistant that helps summarize conversations into well-structured notes.

Given a conversation between a user and an AI assistant, your task is to create a concise, well-organized note that captures the key points, insights, and conclusions.

You MUST respond in JSON format with the following structure:
{
  "title": "A clear, descriptive title for the note (max 100 characters)",
  "content": "The note content in Markdown format. Include:
- A brief summary at the top
- Key points as bullet points or numbered list
- Important conclusions or insights
- Any action items or follow-ups mentioned",
  "tags": ["tag1", "tag2", "tag3"]
}

Guidelines:
- The title should be descriptive but concise
- Use Markdown formatting in the content (headers, bullets, bold, etc.)
- Extract 3-5 relevant tags that categorize the topic
- Focus on the most valuable information, not every detail
- If code was discussed, include relevant code snippets
- Preserve important context and decisions made
- Respond in the same language as the original conversation`
}

func buildSummaryPrompt(conversationTitle, conversationText string) string {
	return fmt.Sprintf(`Please summarize the following conversation into a well-structured note.

Conversation Title: %s

Conversation:
%s

Create a JSON response with title, content (in Markdown), and tags.`, conversationTitle, conversationText)
}

func parseAIResponse(content string) (*GeneratedNote, error) {
	// Try to extract JSON from the response
	// Sometimes the AI wraps JSON in markdown code blocks
	jsonContent := extractJSON(content)

	var note GeneratedNote
	if err := json.Unmarshal([]byte(jsonContent), &note); err != nil {
		return nil, fmt.Errorf("failed to parse AI response: %w", err)
	}

	return &note, nil
}

func extractJSON(content string) string {
	// Try to extract JSON from markdown code blocks
	// Look for ```json ... ``` or ``` ... ```
	start := 0
	end := len(content)

	// Find ```json or ```
	for i := 0; i < len(content)-6; i++ {
		if content[i:i+7] == "```json" {
			start = i + 7
			// Find closing ```
			for j := start; j < len(content)-2; j++ {
				if content[j:j+3] == "```" {
					end = j
					return content[start:end]
				}
			}
		} else if content[i:i+3] == "```" && (i == 0 || content[i-1] == '\n') {
			start = i + 3
			// Find closing ```
			for j := start; j < len(content)-2; j++ {
				if content[j:j+3] == "```" {
					end = j
					return content[start:end]
				}
			}
		}
	}

	// No code blocks found, return original content
	return content
}
