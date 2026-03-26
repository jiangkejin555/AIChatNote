package handlers

import (
	"net/http"

	"github.com/chat-note/backend/internal/middleware"
	"github.com/chat-note/backend/internal/models"
	"github.com/chat-note/backend/internal/repository"
	"github.com/chat-note/backend/internal/services"
	"github.com/chat-note/backend/internal/utils"
	"github.com/gin-gonic/gin"
)

type UserSettingsHandler struct {
	settingsRepo   *repository.UserSettingsRepository
	contextService *services.ContextConfigService
}

func NewUserSettingsHandler(contextService *services.ContextConfigService) *UserSettingsHandler {
	return &UserSettingsHandler{
		settingsRepo:   repository.NewUserSettingsRepository(),
		contextService: contextService,
	}
}

// UserSettingsResponse represents the response for user settings
type UserSettingsResponse struct {
	ContextMode string `json:"context_mode"` // summary | simple
	MemoryLevel string `json:"memory_level"` // short | normal | long
}

// GetUserSettings returns the current user's context settings
func (h *UserSettingsHandler) GetUserSettings(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// Get or create user settings with defaults
	defaultMode := h.contextService.GetDefaultMode()
	defaultLevel := h.contextService.GetDefaultLevel()

	settings, err := h.settingsRepo.GetOrCreate(userID, defaultMode, defaultLevel)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "db_error", "Failed to get user settings", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": UserSettingsResponse{
			ContextMode: string(settings.ContextMode),
			MemoryLevel: string(settings.MemoryLevel),
		},
	})
}

// UpdateUserSettingsRequest represents the request for updating user settings
type UpdateUserSettingsRequest struct {
	ContextMode *string `json:"context_mode"` // summary | simple
	MemoryLevel *string `json:"memory_level"` // short | normal | long
}

// UpdateUserSettings updates the current user's context settings
func (h *UserSettingsHandler) UpdateUserSettings(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req UpdateUserSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	// Validate inputs
	if req.ContextMode != nil {
		mode := models.ContextMode(*req.ContextMode)
		if mode != models.ContextModeSummary && mode != models.ContextModeSimple {
			utils.SendError(c, http.StatusBadRequest, "invalid_mode", "context_mode must be 'summary' or 'simple'")
			return
		}
	}

	if req.MemoryLevel != nil {
		level := models.MemoryLevel(*req.MemoryLevel)
		if level != models.MemoryLevelShort && level != models.MemoryLevelNormal && level != models.MemoryLevelLong {
			utils.SendError(c, http.StatusBadRequest, "invalid_level", "memory_level must be 'short', 'normal', or 'long'")
			return
		}
	}

	// Get existing settings or create with defaults
	defaultMode := h.contextService.GetDefaultMode()
	defaultLevel := h.contextService.GetDefaultLevel()

	settings, err := h.settingsRepo.GetOrCreate(userID, defaultMode, defaultLevel)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "db_error", "Failed to get user settings", err)
		return
	}

	// Update fields if provided
	if req.ContextMode != nil {
		settings.ContextMode = models.ContextMode(*req.ContextMode)
	}
	if req.MemoryLevel != nil {
		settings.MemoryLevel = models.MemoryLevel(*req.MemoryLevel)
	}

	// Save changes
	if err := h.settingsRepo.Upsert(settings); err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "db_error", "Failed to update user settings", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": UserSettingsResponse{
			ContextMode: string(settings.ContextMode),
			MemoryLevel: string(settings.MemoryLevel),
		},
	})
}
