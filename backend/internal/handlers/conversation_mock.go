package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/chat-note/backend/internal/models"
	"github.com/chat-note/backend/internal/utils"
	"github.com/gin-gonic/gin"
)

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

	// Save assistant message with model attribution
	assistantMsg := &models.Message{
		ConversationID:  conv.ID,
		Role:            models.RoleAssistant,
		Content:         mockResponse,
		ProviderModelID: conv.CurrentProviderModelID,
		ModelID:         conv.ModelID,
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
		ConversationID:  conv.ID,
		Role:            models.RoleAssistant,
		Content:         mockResponse,
		ProviderModelID: conv.CurrentProviderModelID,
		ModelID:         conv.ModelID,
		CreatedAt:       time.Now(),
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
