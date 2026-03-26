package services

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/chat-note/backend/internal/models"
	"github.com/chat-note/backend/internal/repository"
	"github.com/chat-note/backend/internal/utils"
	"github.com/sashabaranov/go-openai"
)

// Summary generation constants
const (
	WindowAutoSize         = 20 // Trigger summary when messages exceed this
	KeepRecentCount        = 10 // Keep this many recent messages as raw
	SummaryUpdateFrequency = 5  // Update summary every N new messages
	SummaryMaxTokens       = 300
)

type SummaryService struct {
	summaryRepo *repository.SummaryRepository
}

func NewSummaryService() *SummaryService {
	return &SummaryService{
		summaryRepo: repository.NewSummaryRepository(),
	}
}

// GetSummary retrieves the summary for a conversation
func (s *SummaryService) GetSummary(conversationID uint) (*models.ConversationSummary, error) {
	return s.summaryRepo.FindByConversationID(conversationID)
}

// SaveSummary creates or updates the summary for a conversation
func (s *SummaryService) SaveSummary(summary *models.ConversationSummary) error {
	return s.summaryRepo.Upsert(summary)
}

// ShouldGenerateSummary determines if a summary needs to be generated or updated
func (s *SummaryService) ShouldGenerateSummary(totalMessages int, summary *models.ConversationSummary) bool {
	if totalMessages <= WindowAutoSize {
		return false
	}

	if summary == nil {
		// No summary exists, need to create one
		return true
	}

	// Check if enough new messages have been added since last summary
	messagesSinceSummary := totalMessages - int(summary.EndMessageID)
	return messagesSinceSummary >= SummaryUpdateFrequency
}

// GenerateSummary generates a summary for the given messages
// If oldSummary is provided, it performs an incremental update
func (s *SummaryService) GenerateSummary(
	ctx context.Context,
	messages []models.Message,
	oldSummary *models.ConversationSummary,
	client *openai.Client,
	model string,
) (string, error) {
	start := time.Now()
	utils.LogOperationStart("SummaryService", "GenerateSummary", "msgCount", len(messages), "incremental", oldSummary != nil)

	var prompt string
	if oldSummary != nil {
		// Incremental update: combine old summary with new messages
		prompt = s.buildIncrementalSummaryPrompt(oldSummary.Summary, messages)
	} else {
		// Initial summary: process messages with weighted grouping
		prompt = s.buildSummaryPrompt(messages)
	}

	resp, err := client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: model,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleUser,
				Content: prompt,
			},
		},
		MaxTokens:   SummaryMaxTokens,
		Temperature: 0.3, // Lower temperature for more consistent summaries
	})
	if err != nil {
		utils.LogExternalCallError("SummaryService", "openai", err, "model", model)
		return "", fmt.Errorf("failed to generate summary: %w", err)
	}

	if len(resp.Choices) == 0 {
		return "", fmt.Errorf("no response from AI")
	}

	summary := strings.TrimSpace(resp.Choices[0].Message.Content)
	utils.LogLatency("SummaryService", "GenerateSummary", time.Since(start), "summaryLen", len(summary))

	return summary, nil
}

// buildSummaryPrompt creates a prompt for initial summary generation with weighted grouping
func (s *SummaryService) buildSummaryPrompt(messages []models.Message) string {
	total := len(messages)

	// Divide messages into three groups
	third := total / 3
	if third == 0 {
		third = 1
	}

	early := messages[:min(third, total)]
	mid := messages[min(third, total):min(2*third, total)]
	recent := messages[min(2*third, total):]

	return fmt.Sprintf(`请将以下对话压缩为摘要。

权重说明：
- ★★★ 最新对话：请保留完整细节（代码、数据、结论）
- ★ 中期对话：保留关键要点
- 无标记：仅需概括大意

【早期对话 - 简要概括即可】
%s

【中期对话 - 保留关键要点】
%s

【近期对话 - 必须保留完整细节，包括代码】
%s

摘要（200-300字）：`, formatMessages(early), formatMessages(mid), formatMessages(recent))
}

// buildIncrementalSummaryPrompt creates a prompt for incremental summary update
func (s *SummaryService) buildIncrementalSummaryPrompt(oldSummary string, newMessages []models.Message) string {
	return fmt.Sprintf(`请合并以下内容，生成新的摘要。

【之前的摘要】
%s

【新增对话 - 请保留更多细节】
%s

要求：
1. 合并成连贯的摘要
2. 新增对话保留更多细节
3. 早期内容可以进一步精简
4. 总字数控制在 250 字以内

新摘要：`, oldSummary, formatMessages(newMessages))
}

// formatMessages formats a slice of messages into a string
func formatMessages(messages []models.Message) string {
	var sb strings.Builder
	for _, msg := range messages {
		role := "User"
		if msg.Role == models.RoleAssistant {
			role = "Assistant"
		}
		fmt.Fprintf(&sb, "%s: %s\n", role, msg.Content)
	}
	return sb.String()
}
