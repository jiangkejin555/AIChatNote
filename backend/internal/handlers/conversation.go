package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/chat-note/backend/internal/config"
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
	convRepo            *repository.ConversationRepository
	msgRepo             *repository.MessageRepository
	providerRepo        *repository.ProviderRepository
	modelRepo           *repository.ProviderModelRepository
	requestRepo         *repository.MessageRequestRepository
	aesCrypto           *crypto.AESCrypto
	mockEnabled         bool
	titleGeneratorCfg   config.TitleGeneratorConfig
}

const mockResponse = "这是 Mock AI 的回复。如果你需要测试真实 AI 功能，请配置相应的 API Key。\n\n你可以继续与我对话，我会一直返回这个 Mock 响应。"

func NewConversationHandler(cfg *config.Config, aesCrypto *crypto.AESCrypto) *ConversationHandler {
	return &ConversationHandler{
		convRepo:          repository.NewConversationRepository(),
		msgRepo:           repository.NewMessageRepository(),
		providerRepo:      repository.NewProviderRepository(),
		modelRepo:         repository.NewProviderModelRepository(),
		requestRepo:       repository.NewMessageRequestRepository(),
		aesCrypto:         aesCrypto,
		mockEnabled:       cfg.Mock.Enabled,
		titleGeneratorCfg: cfg.TitleGenerator,
	}
}

type CreateConversationRequest struct {
	ProviderModelID *uuid.UUID `json:"provider_model_id"`
	ModelID         string     `json:"model_id"` // Model ID snapshot (e.g., "gpt-4o")
	Title           string     `json:"title"`
}

type SendMessageRequest struct {
	Content   string `json:"content" binding:"required"`
	Stream    bool   `json:"stream"`
	RequestID string `json:"request_id"` // Optional UUID for request deduplication
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

	// If model_id is not provided but provider_model_id is, fetch model_id from database
	modelID := req.ModelID
	if modelID == "" && req.ProviderModelID != nil {
		providerModel, err := h.modelRepo.FindByID(*req.ProviderModelID)
		if err == nil {
			modelID = providerModel.ModelID
		}
	}

	conv := &models.Conversation{
		UserID:          userID,
		ProviderModelID: req.ProviderModelID,
		ModelID:         modelID,
		Title:           title,
	}

	if err := h.convRepo.Create(conv); err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "create_error", "Failed to create conversation", err)
		return
	}

	utils.LogOperationSuccess("ConversationHandler", "Create", "convID", conv.ID, "userID", userID, "title", title)
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

	utils.LogOperationSuccess("ConversationHandler", "Delete", "convID", convID, "userID", userID)
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

	utils.LogOperationStart("ConversationHandler", "SendMessage", "convID", convID, "userID", userID, "stream", req.Stream, "requestID", req.RequestID)

	// Handle request deduplication if request_id is provided
	var msgReq *models.MessageRequest
	var isNewRequest bool
	if req.RequestID != "" {
		msgReq, isNewRequest, err = h.handleRequestDeduplication(c, conv.ID, req.RequestID, 0)
		if err != nil {
			// Error already sent to client
			return
		}
		if msgReq != nil && !isNewRequest {
			// Existing request (completed or processing), response already sent
			return
		}
		// New request (isNewRequest=true), continue with normal processing
	}

	// Save user message
	userMsg := &models.Message{
		ConversationID: conv.ID,
		Role:           models.RoleUser,
		Content:        req.Content,
	}
	if err := h.msgRepo.Create(userMsg); err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "save_error", "Failed to save message", err)
		// Mark request as failed if we have one
		if msgReq != nil && msgReq.ID > 0 {
			h.requestRepo.SetFailed(msgReq.ID)
		}
		return
	}

	// Update request with user message ID
	if msgReq != nil && msgReq.ID > 0 {
		if err := h.requestRepo.SetUserMessage(msgReq.ID, userMsg.ID); err != nil {
			utils.LogOperationError("ConversationHandler", "SendMessage", err, "step", "set_user_message_id", "requestID", msgReq.ID)
		}
	}

	// Handle mock mode
	if h.mockEnabled {
		utils.LogInfo("ConversationHandler", "SendMessage", "mock_mode", true, "convID", convID)
		if req.Stream {
			h.handleMockStreamResponse(c, conv, msgReq)
		} else {
			h.handleMockNonStreamResponse(c, conv, msgReq)
		}
		return
	}

	// Get provider model and provider info
	if conv.ProviderModelID == nil {
		// Model has been deleted - show friendly error with model_id snapshot
		modelInfo := "未知模型"
		if conv.ModelID != "" {
			modelInfo = conv.ModelID
		}
		utils.SendError(c, http.StatusBadRequest, "model_deleted", "该会话使用的模型已删除("+modelInfo+")，无法继续对话")
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
		utils.LogOperationError("ConversationHandler", "SendMessage", err, "step", "decrypt_api_key", "providerID", provider.ID)
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
		h.handleStreamResponse(c, client, providerModel.ModelID, chatMessages, conv, msgReq)
	} else {
		// Non-streaming response
		h.handleNonStreamResponse(c, client, providerModel.ModelID, chatMessages, conv, msgReq)
	}
}

func (h *ConversationHandler) handleStreamResponse(c *gin.Context, client *openai.Client, model string, messages []openai.ChatCompletionMessage, conv *models.Conversation, msgReq *models.MessageRequest) {
	start := time.Now()
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	utils.LogInfo("ConversationHandler", "StreamResponse started", "convID", conv.ID, "model", model)

	ctx := context.Background()
	req := openai.ChatCompletionRequest{
		Model:    model,
		Messages: messages,
		Stream:   true,
	}

	stream, err := client.CreateChatCompletionStream(ctx, req)
	if err != nil {
		utils.LogExternalCallError("ConversationHandler", "openai", err, "convID", conv.ID, "model", model)
		fmt.Fprintf(c.Writer, "data: {\"error\":\"%s\"}\n\n", err.Error())
		c.Writer.Flush()
		// Mark request as failed
		if msgReq != nil && msgReq.ID > 0 {
			h.requestRepo.SetFailed(msgReq.ID)
		}
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

			chunk := map[string]any{
				"id":      response.ID,
				"object":  response.Object,
				"created": response.Created,
				"model":   response.Model,
				"choices": []map[string]any{
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
	err = h.msgRepo.Create(assistantMsg)
	if err != nil {
		utils.LogOperationError("ConversationHandler", "StreamResponse", err, "step", "create_message", "convID", conv.ID)
		return
	}

	// Update request status to completed
	if msgReq != nil && msgReq.ID > 0 {
		if err := h.requestRepo.SetCompleted(msgReq.ID, assistantMsg.ID); err != nil {
			utils.LogOperationError("ConversationHandler", "StreamResponse", err, "step", "set_request_completed", "requestID", msgReq.ID)
		}
	}

	// Update conversation timestamp
	h.convRepo.Update(conv)

	latency := time.Since(start)
	utils.LogLatencyWithSlowWarning("ConversationHandler", "StreamResponse", latency, "convID", conv.ID, "model", model, "responseLen", len(fullContent))

	fmt.Fprintf(c.Writer, "data: [DONE]\n\n")
	c.Writer.Flush()
}

func (h *ConversationHandler) handleNonStreamResponse(c *gin.Context, client *openai.Client, model string, messages []openai.ChatCompletionMessage, conv *models.Conversation, msgReq *models.MessageRequest) {
	start := time.Now()
	ctx := context.Background()
	req := openai.ChatCompletionRequest{
		Model:    model,
		Messages: messages,
	}

	resp, err := client.CreateChatCompletion(ctx, req)
	if err != nil {
		utils.LogExternalCallError("ConversationHandler", "openai", err, "convID", conv.ID, "model", model)
		utils.SendError(c, http.StatusInternalServerError, "llm_error", err.Error())
		// Mark request as failed
		if msgReq != nil && msgReq.ID > 0 {
			h.requestRepo.SetFailed(msgReq.ID)
		}
		return
	}

	if len(resp.Choices) == 0 {
		utils.LogWarn("ConversationHandler", "NonStreamResponse", "convID", conv.ID, "reason", "no_response_from_model")
		utils.SendError(c, http.StatusInternalServerError, "no_response", "No response from model")
		// Mark request as failed
		if msgReq != nil && msgReq.ID > 0 {
			h.requestRepo.SetFailed(msgReq.ID)
		}
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
		// Mark request as failed
		if msgReq != nil && msgReq.ID > 0 {
			h.requestRepo.SetFailed(msgReq.ID)
		}
		return
	}

	// Update request status to completed
	if msgReq != nil && msgReq.ID > 0 {
		if err := h.requestRepo.SetCompleted(msgReq.ID, assistantMsg.ID); err != nil {
			utils.LogOperationError("ConversationHandler", "NonStreamResponse", err, "step", "set_request_completed", "requestID", msgReq.ID)
		}
	}

	// Update conversation timestamp
	h.convRepo.Update(conv)

	latency := time.Since(start)
	utils.LogLatencyWithSlowWarning("ConversationHandler", "NonStreamResponse", latency, "convID", conv.ID, "model", model, "responseLen", len(content))

	c.JSON(http.StatusOK, gin.H{"data": assistantMsg})
}

// handleMockStreamResponse handles mock streaming response
func (h *ConversationHandler) handleMockStreamResponse(c *gin.Context, conv *models.Conversation, msgReq *models.MessageRequest) {
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
	err := h.msgRepo.Create(assistantMsg)
	if err != nil {
		utils.LogOperationError("ConversationHandler", "MockStreamResponse", err, "step", "create_message", "convID", conv.ID)
		return
	}
	// Update request status to completed
	if msgReq != nil && msgReq.ID > 0 {
		if err := h.requestRepo.SetCompleted(msgReq.ID, assistantMsg.ID); err != nil {
			utils.LogOperationError("ConversationHandler", "MockStreamResponse", err, "step", "set_request_completed", "requestID", msgReq.ID)
		}
	}

	// Update conversation timestamp
	h.convRepo.Update(conv)

	fmt.Fprintf(c.Writer, "data: [DONE]\n\n")
	c.Writer.Flush()
}

// handleMockNonStreamResponse handles mock non-streaming response
func (h *ConversationHandler) handleMockNonStreamResponse(c *gin.Context, conv *models.Conversation, msgReq *models.MessageRequest) {
	assistantMsg := &models.Message{
		ConversationID: conv.ID,
		Role:           models.RoleAssistant,
		Content:        mockResponse,
		CreatedAt:      time.Now(),
	}
	if err := h.msgRepo.Create(assistantMsg); err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "save_error", "Failed to save response", err)
		// Mark request as failed
		if msgReq != nil && msgReq.ID > 0 {
			h.requestRepo.SetFailed(msgReq.ID)
		}
		return
	}

	// Update request status to completed
	if msgReq != nil && msgReq.ID > 0 {
		if err := h.requestRepo.SetCompleted(msgReq.ID, assistantMsg.ID); err != nil {
			utils.LogOperationError("ConversationHandler", "MockNonStreamResponse", err, "step", "set_request_completed", "requestID", msgReq.ID)
		}
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

	utils.LogOperationStart("ConversationHandler", "Regenerate", "convID", convID, "msgID", msgID, "userID", userID)

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
		// Model has been deleted - show friendly error with model_id snapshot
		modelInfo := "未知模型"
		if conv.ModelID != "" {
			modelInfo = conv.ModelID
		}
		utils.SendError(c, http.StatusBadRequest, "model_deleted", "该会话使用的模型已删除("+modelInfo+")，无法继续对话")
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

// handleRequestDeduplication handles request deduplication logic
// Returns:
// - request, isNew, nil: Request found or created
//   - If isNew=true: New request created, proceed with normal processing
//   - If isNew=false: Existing request (completed/processing), response already sent
//
// - nil, false, error: Error occurred, response already sent to client
const maxDedupRetries = 3

func (h *ConversationHandler) handleRequestDeduplication(c *gin.Context, convID uint, requestID string, retryCount int) (*models.MessageRequest, bool, error) {
	// Try to find existing request
	existingReq, err := h.requestRepo.FindByRequestID(requestID)
	if err != nil && err != repository.ErrRequestNotFound {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "db_error", "Failed to check request", err)
		return nil, false, err
	}

	if existingReq != nil {
		switch existingReq.Status {
		case models.StatusCompleted:
			// Request already completed, return existing assistant message
			if existingReq.AssistantMessageID != nil {
				assistantMsg, err := h.msgRepo.FindByID(*existingReq.AssistantMessageID)
				if err != nil {
					utils.SendErrorWithErr(c, http.StatusInternalServerError, "db_error", "Failed to fetch existing response", err)
					return nil, false, err
				}
				utils.LogInfo("ConversationHandler", "RequestDeduplication", "status", "completed", "requestID", requestID)
				c.JSON(http.StatusOK, gin.H{"data": assistantMsg, "deduplicated": true})
				return existingReq, false, nil
			}
			// Completed but no message (shouldn't happen), fall through to process normally

		case models.StatusProcessing:
			// Request still processing
			utils.LogInfo("ConversationHandler", "RequestDeduplication", "status", "processing", "requestID", requestID)
			c.JSON(http.StatusAccepted, gin.H{
				"error":      "request_in_progress",
				"message":    "请求正在处理中，请稍后刷新查看",
				"request_id": requestID,
			})
			return existingReq, false, nil

		case models.StatusFailed:
			// Request failed, allow retry by creating new request
			utils.LogInfo("ConversationHandler", "RequestDeduplication", "status", "failed", "requestID", requestID)
			// Delete failed request to allow retry
			h.requestRepo.Delete(existingReq.ID)
			// Continue to create new request below
		}
	}

	// Create new request record
	newReq := &models.MessageRequest{
		ConversationID: convID,
		RequestID:      requestID,
		Status:         models.StatusProcessing,
	}
	if _, err := h.requestRepo.CreateIfNotExists(newReq); err != nil {
		if err == repository.ErrRequestAlreadyExists {
			// Race condition: another request created it between our check and create
			// Retry with limit to prevent infinite recursion
			if retryCount >= maxDedupRetries {
				utils.SendError(c, http.StatusTooManyRequests, "retry_exceeded", "请求处理繁忙，请稍后重试")
				return nil, false, fmt.Errorf("max retries exceeded for request deduplication")
			}
			return h.handleRequestDeduplication(c, convID, requestID, retryCount+1)
		}
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "db_error", "Failed to create request", err)
		return nil, false, err
	}

	utils.LogInfo("ConversationHandler", "RequestDeduplication", "status", "new", "requestID", requestID)
	return newReq, true, nil
}

// GenerateTitle generates a title for the conversation based on the first user message
func (h *ConversationHandler) GenerateTitle(c *gin.Context) {
	userID := middleware.GetUserID(c)
	convID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid conversation ID")
		return
	}

	// Verify conversation exists and belongs to user
	conv, err := h.convRepo.FindByIDAndUserID(uint(convID), userID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusNotFound, "not_found", "Conversation not found", err)
		return
	}

	// Get first user message
	firstMsg, err := h.msgRepo.GetFirstUserMessage(conv.ID)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "no_message", "对话无消息")
		return
	}

	// Generate title using AI
	title, err := h.generateTitleWithAI(conv, firstMsg.Content)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "generate_error", "Failed to generate title", err)
		return
	}

	// Update conversation title
	if err := h.convRepo.UpdateTitle(conv.ID, userID, title); err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "update_error", "Failed to update title", err)
		return
	}

	utils.LogOperationSuccess("ConversationHandler", "GenerateTitle", "convID", convID, "userID", userID, "title", title)
	c.JSON(http.StatusOK, gin.H{"data": gin.H{"title": title}})
}

// fallbackTitle generates a fallback title from the first message
func fallbackTitle(firstMessage string) string {
	const maxLen = 10
	runes := []rune(firstMessage)
	if len(runes) > maxLen {
		return string(runes[:maxLen]) + "..."
	}
	return firstMessage
}

// generateTitleWithAI calls AI to generate a title based on the first message
func (h *ConversationHandler) generateTitleWithAI(_ *models.Conversation, firstMessage string) (string, error) {
	// Handle mock mode - use fallback
	if h.mockEnabled {
		return fallbackTitle(firstMessage), nil
	}

	// Check if title generator is enabled and properly configured
	cfg := h.titleGeneratorCfg
	if cfg.Enabled && cfg.APIBase != "" && cfg.APIKey != "" && cfg.Model != "" {
		title, err := h.callTitleGeneratorAPI(firstMessage, cfg)
		if err != nil {
			// Log error but don't fail - use fallback
			utils.LogWarn("ConversationHandler", "generateTitleWithAI", "error", err.Error(), "fallback", "using first 10 chars")
			return fallbackTitle(firstMessage), nil
		}
		return title, nil
	}

	// Title generator not configured - use fallback
	return fallbackTitle(firstMessage), nil
}

// callTitleGeneratorAPI calls the configured title generator API
func (h *ConversationHandler) callTitleGeneratorAPI(firstMessage string, cfg config.TitleGeneratorConfig) (string, error) {
	prompt := fmt.Sprintf(`请根据用户的第一条消息，生成一个简洁的聊天标题（最多15个字符）。
只输出标题，不要其他内容。

用户消息：%s`, firstMessage)

	clientCfg := openai.DefaultConfig(cfg.APIKey)
	clientCfg.BaseURL = cfg.APIBase
	client := openai.NewClientWithConfig(clientCfg)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	req := openai.ChatCompletionRequest{
		Model: cfg.Model,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleUser,
				Content: prompt,
			},
		},
		MaxTokens: cfg.MaxTokens,
	}

	resp, err := client.CreateChatCompletion(ctx, req)
	if err != nil {
		return "", err
	}

	if len(resp.Choices) == 0 {
		return "", fmt.Errorf("no response from model")
	}

	title := resp.Choices[0].Message.Content
	// Limit title length
	if len(title) > 50 {
		title = title[:50]
	}

	return title, nil
}
