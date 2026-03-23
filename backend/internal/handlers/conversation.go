package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/chat-note/backend/internal/crypto"
	"github.com/chat-note/backend/internal/middleware"
	"github.com/chat-note/backend/internal/models"
	"github.com/chat-note/backend/internal/repository"
	"github.com/chat-note/backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sashabaranov/go-openai"
)

type ConversationHandler struct {
	convRepo     *repository.ConversationRepository
	msgRepo      *repository.MessageRepository
	providerRepo *repository.ProviderRepository
	modelRepo    *repository.ProviderModelRepository
	aesCrypto    *crypto.AESCrypto
	mockEnabled  bool
}

const mockResponse = "这是 Mock AI 的回复。如果你需要测试真实 AI 功能，请配置相应的 API Key。\n\n你可以继续与我对话，我会一直返回这个 Mock 响应。"

func NewConversationHandler(aesCrypto *crypto.AESCrypto, mockEnabled bool) *ConversationHandler {
	return &ConversationHandler{
		convRepo:     repository.NewConversationRepository(),
		msgRepo:      repository.NewMessageRepository(),
		providerRepo: repository.NewProviderRepository(),
		modelRepo:    repository.NewProviderModelRepository(),
		aesCrypto:    aesCrypto,
		mockEnabled:  mockEnabled,
	}
}

type CreateConversationRequest struct {
	ProviderModelID *uuid.UUID `json:"provider_model_id"`
	Title           string     `json:"title"`
}

type SendMessageRequest struct {
	Content string `json:"content" binding:"required"`
	Stream  bool   `json:"stream"`
}

// List returns all conversations for the user
func (h *ConversationHandler) List(c *gin.Context) {
	userID := middleware.GetUserID(c)

	conversations, err := h.convRepo.FindByUserID(userID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "db_error", "Failed to fetch conversations", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": conversations})
}

// Create creates a new conversation
func (h *ConversationHandler) Create(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req CreateConversationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	title := req.Title
	if title == "" {
		title = "新对话"
	}

	conv := &models.Conversation{
		UserID:          userID,
		ProviderModelID: req.ProviderModelID,
		Title:           title,
	}

	if err := h.convRepo.Create(conv); err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "create_error", "Failed to create conversation", err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": conv})
}

// Get returns a conversation with messages
func (h *ConversationHandler) Get(c *gin.Context) {
	userID := middleware.GetUserID(c)
	convID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid conversation ID")
		return
	}

	conv, err := h.convRepo.FindByIDWithMessagesAndUserID(uint(convID), userID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusNotFound, "not_found", "Conversation not found", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": conv})
}

// Update updates a conversation
func (h *ConversationHandler) Update(c *gin.Context) {
	userID := middleware.GetUserID(c)
	convID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid conversation ID")
		return
	}

	conv, err := h.convRepo.FindByIDAndUserID(uint(convID), userID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusNotFound, "not_found", "Conversation not found", err)
		return
	}

	var req struct {
		Title string `json:"title"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	if req.Title != "" {
		conv.Title = req.Title
	}

	if err := h.convRepo.Update(conv); err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "update_error", "Failed to update conversation", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": conv})
}

// Delete deletes a conversation
func (h *ConversationHandler) Delete(c *gin.Context) {
	userID := middleware.GetUserID(c)
	convID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid conversation ID")
		return
	}

	if err := h.convRepo.Delete(uint(convID), userID); err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "delete_error", "Failed to delete conversation", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Conversation deleted"})
}

// MarkSaved marks a conversation as saved
func (h *ConversationHandler) MarkSaved(c *gin.Context) {
	userID := middleware.GetUserID(c)
	convID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid conversation ID")
		return
	}

	conv, err := h.convRepo.FindByIDAndUserID(uint(convID), userID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusNotFound, "not_found", "Conversation not found", err)
		return
	}

	conv.IsSaved = true
	if err := h.convRepo.Update(conv); err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "update_error", "Failed to mark as saved", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": conv})
}

// GetMessages returns messages for a conversation
func (h *ConversationHandler) GetMessages(c *gin.Context) {
	userID := middleware.GetUserID(c)
	convID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid conversation ID")
		return
	}

	conv, err := h.convRepo.FindByIDAndUserID(uint(convID), userID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusNotFound, "not_found", "Conversation not found", err)
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	beforeID, _ := strconv.ParseUint(c.Query("before_id"), 10, 32)

	var messages []models.Message
	if beforeID > 0 {
		messages, err = h.msgRepo.FindByConversationIDBefore(conv.ID, uint(beforeID), limit)
	} else {
		messages, err = h.msgRepo.FindByConversationID(conv.ID)
	}

	if err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "db_error", "Failed to fetch messages", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": messages})
}

// SendMessage sends a message and optionally streams response
func (h *ConversationHandler) SendMessage(c *gin.Context) {
	userID := middleware.GetUserID(c)
	convID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid conversation ID")
		return
	}

	conv, err := h.convRepo.FindByIDAndUserID(uint(convID), userID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusNotFound, "not_found", "Conversation not found", err)
		return
	}

	var req SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	// Save user message
	userMsg := &models.Message{
		ConversationID: conv.ID,
		Role:           models.RoleUser,
		Content:        req.Content,
	}
	if err := h.msgRepo.Create(userMsg); err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "save_error", "Failed to save message", err)
		return
	}

	// Handle mock mode
	if h.mockEnabled {
		if req.Stream {
			h.handleMockStreamResponse(c, conv)
		} else {
			h.handleMockNonStreamResponse(c, conv)
		}
		return
	}

	// Get provider model and provider info
	if conv.ProviderModelID == nil {
		utils.SendError(c, http.StatusBadRequest, "no_model", "No model configured for this conversation")
		return
	}

	providerModel, err := h.modelRepo.FindByID(*conv.ProviderModelID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusBadRequest, "no_model", "Model not found", err)
		return
	}

	provider, err := h.providerRepo.FindByID(providerModel.ProviderID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusBadRequest, "no_provider", "Provider not found", err)
		return
	}

	// Decrypt API key
	apiKey, err := h.aesCrypto.Decrypt(provider.APIKeyEncrypted)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "decrypt_error", "Failed to decrypt API key", err)
		return
	}

	// Get conversation history
	messages, err := h.msgRepo.FindByConversationID(conv.ID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "db_error", "Failed to fetch messages", err)
		return
	}

	// Build OpenAI messages
	chatMessages := make([]openai.ChatCompletionMessage, len(messages))
	for i, msg := range messages {
		role := openai.ChatMessageRoleUser
		if msg.Role == models.RoleAssistant {
			role = openai.ChatMessageRoleAssistant
		}
		chatMessages[i] = openai.ChatCompletionMessage{
			Role:    role,
			Content: msg.Content,
		}
	}

	// Create OpenAI client
	config := openai.DefaultConfig(apiKey)
	config.BaseURL = provider.APIBase
	client := openai.NewClientWithConfig(config)

	if req.Stream {
		// Streaming response
		h.handleStreamResponse(c, client, providerModel.ModelID, chatMessages, conv)
	} else {
		// Non-streaming response
		h.handleNonStreamResponse(c, client, providerModel.ModelID, chatMessages, conv)
	}
}

func (h *ConversationHandler) handleStreamResponse(c *gin.Context, client *openai.Client, model string, messages []openai.ChatCompletionMessage, conv *models.Conversation) {
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	ctx := context.Background()
	req := openai.ChatCompletionRequest{
		Model:    model,
		Messages: messages,
		Stream:   true,
	}

	stream, err := client.CreateChatCompletionStream(ctx, req)
	if err != nil {
		fmt.Fprintf(c.Writer, "data: {\"error\":\"%s\"}\n\n", err.Error())
		c.Writer.Flush()
		return
	}
	defer stream.Close()

	var fullContent string
	for {
		response, err := stream.Recv()
		if err != nil {
			break
		}

		if len(response.Choices) > 0 {
			content := response.Choices[0].Delta.Content
			fullContent += content

			chunk := map[string]interface{}{
				"id":      response.ID,
				"object":  response.Object,
				"created": response.Created,
				"model":   response.Model,
				"choices": []map[string]interface{}{
					{
						"index": response.Choices[0].Index,
						"delta": map[string]string{
							"content": content,
						},
						"finish_reason": response.Choices[0].FinishReason,
					},
				},
			}
			data, _ := json.Marshal(chunk)
			fmt.Fprintf(c.Writer, "data: %s\n\n", string(data))
			c.Writer.Flush()
		}
	}

	// Save assistant message
	assistantMsg := &models.Message{
		ConversationID: conv.ID,
		Role:           models.RoleAssistant,
		Content:        fullContent,
	}
	h.msgRepo.Create(assistantMsg)

	// Update conversation timestamp
	h.convRepo.Update(conv)

	fmt.Fprintf(c.Writer, "data: [DONE]\n\n")
	c.Writer.Flush()
}

func (h *ConversationHandler) handleNonStreamResponse(c *gin.Context, client *openai.Client, model string, messages []openai.ChatCompletionMessage, conv *models.Conversation) {
	ctx := context.Background()
	req := openai.ChatCompletionRequest{
		Model:    model,
		Messages: messages,
	}

	resp, err := client.CreateChatCompletion(ctx, req)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "llm_error", err.Error())
		return
	}

	if len(resp.Choices) == 0 {
		utils.SendError(c, http.StatusInternalServerError, "no_response", "No response from model")
		return
	}

	content := resp.Choices[0].Message.Content

	// Save assistant message
	assistantMsg := &models.Message{
		ConversationID: conv.ID,
		Role:           models.RoleAssistant,
		Content:        content,
		CreatedAt:      time.Now(),
	}
	if err := h.msgRepo.Create(assistantMsg); err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "save_error", "Failed to save response", err)
		return
	}

	// Update conversation timestamp
	h.convRepo.Update(conv)

	c.JSON(http.StatusOK, gin.H{"data": assistantMsg})
}

// handleMockStreamResponse handles mock streaming response
func (h *ConversationHandler) handleMockStreamResponse(c *gin.Context, conv *models.Conversation) {
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	// Stream response character by character
	for i, char := range mockResponse {
		chunk := map[string]interface{}{
			"id":      fmt.Sprintf("mock-%d", i),
			"object":  "chat.completion.chunk",
			"created": time.Now().Unix(),
			"model":   "mock-model",
			"choices": []map[string]interface{}{
				{
					"index": 0,
					"delta": map[string]string{
						"content": string(char),
					},
					"finish_reason": nil,
				},
			},
		}
		data, _ := json.Marshal(chunk)
		fmt.Fprintf(c.Writer, "data: %s\n\n", string(data))
		c.Writer.Flush()
	}

	// Save assistant message
	assistantMsg := &models.Message{
		ConversationID: conv.ID,
		Role:           models.RoleAssistant,
		Content:        mockResponse,
	}
	h.msgRepo.Create(assistantMsg)

	// Update conversation timestamp
	h.convRepo.Update(conv)

	fmt.Fprintf(c.Writer, "data: [DONE]\n\n")
	c.Writer.Flush()
}

// handleMockNonStreamResponse handles mock non-streaming response
func (h *ConversationHandler) handleMockNonStreamResponse(c *gin.Context, conv *models.Conversation) {
	assistantMsg := &models.Message{
		ConversationID: conv.ID,
		Role:           models.RoleAssistant,
		Content:        mockResponse,
		CreatedAt:      time.Now(),
	}
	if err := h.msgRepo.Create(assistantMsg); err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "save_error", "Failed to save response", err)
		return
	}

	// Update conversation timestamp
	h.convRepo.Update(conv)

	c.JSON(http.StatusOK, gin.H{"data": assistantMsg})
}

// Regenerate regenerates the last assistant response
func (h *ConversationHandler) Regenerate(c *gin.Context) {
	userID := middleware.GetUserID(c)
	convID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid conversation ID")
		return
	}

	msgID, err := strconv.ParseUint(c.Param("messageId"), 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid message ID")
		return
	}

	conv, err := h.convRepo.FindByIDAndUserID(uint(convID), userID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusNotFound, "not_found", "Conversation not found", err)
		return
	}

	// Delete the assistant message
	if err := h.msgRepo.Delete(uint(msgID)); err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "delete_error", "Failed to delete message", err)
		return
	}

	// Get updated messages
	messages, err := h.msgRepo.FindByConversationID(conv.ID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "db_error", "Failed to fetch messages", err)
		return
	}

	// Handle mock mode
	if h.mockEnabled {
		assistantMsg := &models.Message{
			ConversationID: conv.ID,
			Role:           models.RoleAssistant,
			Content:        mockResponse,
		}
		if err := h.msgRepo.Create(assistantMsg); err != nil {
			utils.SendErrorWithErr(c, http.StatusInternalServerError, "save_error", "Failed to save response", err)
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": assistantMsg})
		return
	}

	// Get provider info
	if conv.ProviderModelID == nil {
		utils.SendError(c, http.StatusBadRequest, "no_model", "No model configured")
		return
	}

	providerModel, err := h.modelRepo.FindByID(*conv.ProviderModelID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusBadRequest, "no_model", "Model not found", err)
		return
	}

	provider, err := h.providerRepo.FindByID(providerModel.ProviderID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusBadRequest, "no_provider", "Provider not found", err)
		return
	}

	apiKey, err := h.aesCrypto.Decrypt(provider.APIKeyEncrypted)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "decrypt_error", "Failed to decrypt API key", err)
		return
	}

	// Build messages
	chatMessages := make([]openai.ChatCompletionMessage, len(messages))
	for i, msg := range messages {
		role := openai.ChatMessageRoleUser
		if msg.Role == models.RoleAssistant {
			role = openai.ChatMessageRoleAssistant
		}
		chatMessages[i] = openai.ChatCompletionMessage{
			Role:    role,
			Content: msg.Content,
		}
	}

	config := openai.DefaultConfig(apiKey)
	config.BaseURL = provider.APIBase
	client := openai.NewClientWithConfig(config)

	ctx := context.Background()
	req := openai.ChatCompletionRequest{
		Model:    providerModel.ModelID,
		Messages: chatMessages,
	}

	resp, err := client.CreateChatCompletion(ctx, req)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "llm_error", err.Error())
		return
	}

	if len(resp.Choices) == 0 {
		utils.SendError(c, http.StatusInternalServerError, "no_response", "No response from model")
		return
	}

	content := resp.Choices[0].Message.Content

	assistantMsg := &models.Message{
		ConversationID: conv.ID,
		Role:           models.RoleAssistant,
		Content:        content,
	}
	if err := h.msgRepo.Create(assistantMsg); err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "save_error", "Failed to save response", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": assistantMsg})
}
