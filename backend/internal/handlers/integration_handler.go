package handlers

import (
	"fmt"
	"net/http"

	"github.com/chat-note/backend/internal/middleware"
	"github.com/chat-note/backend/internal/repository"
	"github.com/chat-note/backend/internal/services"
	"github.com/chat-note/backend/internal/utils"
	"github.com/gin-gonic/gin"
)

type IntegrationHandler struct {
	repo          repository.IntegrationRepository
	notionService services.NotionService
}

func NewIntegrationHandler(repo repository.IntegrationRepository, notionService services.NotionService) *IntegrationHandler {
	return &IntegrationHandler{
		repo:          repo,
		notionService: notionService,
	}
}

// GetNotionAuthURL returns the OAuth URL for Notion
func (h *IntegrationHandler) GetNotionAuthURL(c *gin.Context) {
	url := h.notionService.GetAuthURL()
	c.JSON(http.StatusOK, gin.H{
		"url": url,
	})
}

type NotionCallbackRequest struct {
	Code string `json:"code" binding:"required"`
}

// NotionCallback handles the Notion OAuth callback
func (h *IntegrationHandler) NotionCallback(c *gin.Context) {
	var req NotionCallbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	userID := middleware.GetUserID(c)
	if userID == 0 {
		utils.SendError(c, http.StatusUnauthorized, "unauthorized", "Unauthorized")
		return
	}

	err := h.notionService.HandleCallback(req.Code, userID)
	if err != nil {
		// Log detailed error for debugging
		c.Error(err)
		utils.SendError(c, http.StatusInternalServerError, "internal_error", fmt.Sprintf("Failed to connect to Notion: %v", err))
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Successfully connected to Notion",
	})
}

// GetNotionStatus returns whether the user has connected to Notion
func (h *IntegrationHandler) GetNotionStatus(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		utils.SendError(c, http.StatusUnauthorized, "unauthorized", "Unauthorized")
		return
	}

	integration, err := h.repo.GetByUserIDAndProvider(userID, "notion")
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "internal_error", "Failed to check integration status")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"connected": integration != nil,
	})
}

// DisconnectNotion removes the Notion integration for the user
func (h *IntegrationHandler) DisconnectNotion(c *gin.Context) {
	userID := middleware.GetUserID(c)
	if userID == 0 {
		utils.SendError(c, http.StatusUnauthorized, "unauthorized", "Unauthorized")
		return
	}

	err := h.repo.Delete(userID, "notion")
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "internal_error", "Failed to disconnect Notion")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Successfully disconnected from Notion",
	})
}
