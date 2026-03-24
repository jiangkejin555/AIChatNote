package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/chat-note/backend/internal/crypto"
	"github.com/chat-note/backend/internal/models"
	"github.com/chat-note/backend/internal/repository"
	"github.com/chat-note/backend/internal/utils"
	"github.com/sashabaranov/go-openai"
)

type AIService struct {
	convRepo         *repository.ConversationRepository
	providerRepo     *repository.ProviderRepository
	providerModelRepo *repository.ProviderModelRepository
	aesCrypto        *crypto.AESCrypto
	mockEnabled      bool
}

func NewAIService(mockEnabled bool) *AIService {
	return &AIService{
		convRepo:          repository.NewConversationRepository(),
		providerRepo:      repository.NewProviderRepository(),
		providerModelRepo: repository.NewProviderModelRepository(),
		mockEnabled:       mockEnabled,
	}
}

// SetCrypto sets the AES crypto for decrypting API keys
func (s *AIService) SetCrypto(aesCrypto *crypto.AESCrypto) {
	s.aesCrypto = aesCrypto
}

type GeneratedNote struct {
	Title   string   `json:"title"`
	Content string   `json:"content"`
	Tags    []string `json:"tags"`
}

// GenerateNoteFromConversation generates a note summary from a conversation
// It uses the conversation's associated ProviderModel for AI generation
func (s *AIService) GenerateNoteFromConversation(ctx context.Context, convID, userID uint) (*GeneratedNote, error) {
	start := time.Now()
	utils.LogOperationStart("AIService", "GenerateNoteFromConversation", "convID", convID, "userID", userID, "mockMode", s.mockEnabled)

	// Return mock data if mock mode is enabled
	if s.mockEnabled {
		utils.LogLatency("AIService", "GenerateNoteFromConversation", time.Since(start), "convID", convID, "mockMode", true)
		return &GeneratedNote{
			Title: "AI 对话总结 (Mock)",
			Content: `## 📌 核心知识点

### 概念与原理

这是 Mock 生成的笔记内容，用于测试目的。

### 关键结论

- 讨论了 AI 相关话题
- 探索了技术实现方案
- 确定了下一步计划

这是一次富有成效的对话。如果你需要真实 AI 功能，请配置相应的 Provider。`,
			Tags: []string{"mock", "测试"},
		}, nil
	}

	// Get conversation with messages (ensures user owns the conversation)
	conv, err := s.convRepo.FindByIDWithMessagesAndUserID(convID, userID)
	if err != nil {
		utils.LogOperationError("AIService", "GenerateNoteFromConversation", err, "convID", convID, "userID", userID, "step", "get_conversation")
		return nil, fmt.Errorf("conversation not found: %w", err)
	}

	// Validate that conversation has an associated model
	if conv.ProviderModelID == nil {
		utils.LogOperationError("AIService", "GenerateNoteFromConversation", fmt.Errorf("no model associated"), "convID", convID, "userID", userID, "step", "validate_model")
		return nil, fmt.Errorf("该会话没有关联模型，无法使用 AI 总结功能")
	}

	// Get the ProviderModel
	providerModel, err := s.providerModelRepo.FindByID(*conv.ProviderModelID)
	if err != nil {
		utils.LogOperationError("AIService", "GenerateNoteFromConversation", err, "convID", convID, "userID", userID, "step", "get_provider_model")
		return nil, fmt.Errorf("关联的模型已不可用")
	}

	// Get the Provider
	provider, err := s.providerRepo.FindByID(providerModel.ProviderID)
	if err != nil {
		utils.LogOperationError("AIService", "GenerateNoteFromConversation", err, "convID", convID, "userID", userID, "step", "get_provider")
		return nil, fmt.Errorf("关联的 Provider 已不可用")
	}

	// Decrypt API Key
	if s.aesCrypto == nil {
		return nil, fmt.Errorf("crypto service not initialized")
	}
	apiKey, err := s.aesCrypto.Decrypt(provider.APIKeyEncrypted)
	if err != nil {
		utils.LogOperationError("AIService", "GenerateNoteFromConversation", err, "convID", convID, "userID", userID, "step", "decrypt_api_key")
		return nil, fmt.Errorf("failed to decrypt API key: %w", err)
	}

	// Create OpenAI client with the provider's config
	clientConfig := openai.DefaultConfig(apiKey)
	clientConfig.BaseURL = provider.APIBase
	client := openai.NewClientWithConfig(clientConfig)

	// Build conversation text
	var conversationText string
	var msgCount int
	for _, msg := range conv.Messages {
		role := "User"
		if msg.Role == models.RoleAssistant {
			role = "Assistant"
		}
		conversationText += fmt.Sprintf("%s: %s\n\n", role, msg.Content)
		msgCount++
	}

	// Build prompt for summary
	prompt := buildSummaryPrompt(conv.Title, conversationText)

	// Call AI API
	apiStart := time.Now()
	resp, err := client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
		Model: providerModel.ModelID,
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
	apiLatency := time.Since(apiStart)

	if err != nil {
		utils.LogExternalCallError("AIService", string(provider.Type), err, "convID", convID, "msgCount", msgCount, "model", providerModel.ModelID, "apiLatency_ms", apiLatency.Milliseconds())
		return nil, fmt.Errorf("failed to generate note: %w", err)
	}

	if len(resp.Choices) == 0 {
		utils.LogWarn("AIService", "GenerateNoteFromConversation", "convID", convID, "reason", "no_response_choices")
		return nil, fmt.Errorf("no response from AI")
	}

	utils.LogExternalCall("AIService", string(provider.Type), providerModel.ModelID, apiLatency, "convID", convID, "msgCount", msgCount)

	// Parse JSON response
	content := resp.Choices[0].Message.Content
	note, err := parseAIResponse(content)
	if err != nil {
		// Fallback: return raw content as note
		utils.LogWarn("AIService", "GenerateNoteFromConversation", "convID", convID, "reason", "json_parse_failed", "usingFallback", true)
		return &GeneratedNote{
			Title:   conv.Title + " - Summary",
			Content: content,
			Tags:    []string{"AI生成"},
		}, nil
	}

	utils.LogLatency("AIService", "GenerateNoteFromConversation", time.Since(start), "convID", convID, "title", note.Title, "tagCount", len(note.Tags))
	return note, nil
}

func getSystemPrompt() string {
	return `你是一个专业的知识整理助手，擅长从 AI 对话中提炼核心知识。

## 任务
将用户与 AI 的对话总结为结构化的学习笔记。

## 输出格式
你必须以 JSON 格式响应：
{
  "title": "简洁准确的标题（不超过50字）",
  "content": "Markdown 格式的笔记内容",
  "tags": ["1-3个相关标签"]
}

## content 内容结构

笔记内容应包含以下部分：

### 📌 核心知识点

梳理对话中讨论的主要内容，按主题组织：

- **概念与原理**：解释讨论的核心概念、工作原理
- **关键结论**：重要的结论、决策、最佳实践
- **代码示例**：保留必要的技术细节和代码片段

使用合理的层级结构（H3/H4 + 列表）组织内容，使其清晰易读。

## 注意事项
- 使用与对话相同的语言输出
- 聚焦有价值的知识，忽略寒暄和无关内容
- 保留足够的技术细节，不要过度精简
- 代码块必须标注语言类型
- 标题要能准确概括对话主题
- 标签应涵盖主要技术领域和关键概念`
}

func buildSummaryPrompt(conversationTitle, conversationText string) string {
	return fmt.Sprintf(`请总结以下对话：

对话标题：%s

对话内容：
%s

请生成 JSON 格式的笔记。`, conversationTitle, conversationText)
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
