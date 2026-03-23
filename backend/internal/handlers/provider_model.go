package handlers

import (
	"net/http"
	"time"

	"github.com/chat-note/backend/internal/middleware"
	"github.com/chat-note/backend/internal/models"
	"github.com/chat-note/backend/internal/repository"
	"github.com/chat-note/backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ProviderModelHandler struct {
	modelRepo    *repository.ProviderModelRepository
	providerRepo *repository.ProviderRepository
}

func NewProviderModelHandler() *ProviderModelHandler {
	return &ProviderModelHandler{
		modelRepo:    repository.NewProviderModelRepository(),
		providerRepo: repository.NewProviderRepository(),
	}
}

type AddModelRequest struct {
	ModelID     string `json:"model_id" binding:"required"`
	DisplayName string `json:"display_name"`
	IsDefault   bool   `json:"is_default"`
}

type BatchAddModelsRequest struct {
	Models         []AddModelRequest `json:"models" binding:"required"`
	DefaultModelID string            `json:"default_model_id"`
}

type UpdateModelRequest struct {
	DisplayName string `json:"display_name"`
	IsDefault   bool   `json:"is_default"`
	Enabled     bool   `json:"enabled"`
}

// List returns all models for a provider
func (h *ProviderModelHandler) List(c *gin.Context) {
	userID := middleware.GetUserID(c)
	providerID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid provider ID")
		return
	}

	// Verify provider belongs to user
	provider, err := h.providerRepo.FindByIDAndUserID(providerID, userID)
	if err != nil {
		utils.SendError(c, http.StatusNotFound, "not_found", "Provider not found")
		return
	}

	models, err := h.modelRepo.FindByProviderID(provider.ID)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "db_error", "Failed to fetch models")
		return
	}

	c.JSON(http.StatusOK, gin.H{"models": models})
}

// Add adds a new model to a provider
func (h *ProviderModelHandler) Add(c *gin.Context) {
	userID := middleware.GetUserID(c)
	providerID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid provider ID")
		return
	}

	provider, err := h.providerRepo.FindByIDAndUserID(providerID, userID)
	if err != nil {
		utils.SendError(c, http.StatusNotFound, "not_found", "Provider not found")
		return
	}

	var req AddModelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	displayName := req.DisplayName
	if displayName == "" {
		displayName = req.ModelID
	}

	model := &models.ProviderModel{
		ProviderID:  provider.ID,
		ModelID:     req.ModelID,
		DisplayName: displayName,
		IsDefault:   req.IsDefault,
		Enabled:     true,
	}

	if err := h.modelRepo.Create(model); err != nil {
		utils.SendError(c, http.StatusInternalServerError, "create_error", "Failed to add model")
		return
	}

	c.JSON(http.StatusCreated, gin.H{"model": model})
}

// Update updates a model
func (h *ProviderModelHandler) Update(c *gin.Context) {
	userID := middleware.GetUserID(c)
	providerID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid provider ID")
		return
	}

	modelID, err := uuid.Parse(c.Param("modelId"))
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid model ID")
		return
	}

	_, err = h.providerRepo.FindByIDAndUserID(providerID, userID)
	if err != nil {
		utils.SendError(c, http.StatusNotFound, "not_found", "Provider not found")
		return
	}

	model, err := h.modelRepo.FindByIDAndProviderID(modelID, providerID)
	if err != nil {
		utils.SendError(c, http.StatusNotFound, "not_found", "Model not found")
		return
	}

	var req UpdateModelRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	if req.DisplayName != "" {
		model.DisplayName = req.DisplayName
	}
	model.IsDefault = req.IsDefault
	model.Enabled = req.Enabled
	model.UpdatedAt = time.Now()

	if err := h.modelRepo.Update(model); err != nil {
		utils.SendError(c, http.StatusInternalServerError, "update_error", "Failed to update model")
		return
	}

	c.JSON(http.StatusOK, gin.H{"model": model})
}

// Delete deletes a model
func (h *ProviderModelHandler) Delete(c *gin.Context) {
	userID := middleware.GetUserID(c)
	providerID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid provider ID")
		return
	}

	modelID, err := uuid.Parse(c.Param("modelId"))
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid model ID")
		return
	}

	_, err = h.providerRepo.FindByIDAndUserID(providerID, userID)
	if err != nil {
		utils.SendError(c, http.StatusNotFound, "not_found", "Provider not found")
		return
	}

	if err := h.modelRepo.Delete(modelID, providerID); err != nil {
		utils.SendError(c, http.StatusInternalServerError, "delete_error", "Failed to delete model")
		return
	}

	utils.SendSuccess(c, "Model deleted successfully")
}

// BatchAdd adds multiple models to a provider
func (h *ProviderModelHandler) BatchAdd(c *gin.Context) {
	userID := middleware.GetUserID(c)
	providerID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid provider ID")
		return
	}

	provider, err := h.providerRepo.FindByIDAndUserID(providerID, userID)
	if err != nil {
		utils.SendError(c, http.StatusNotFound, "not_found", "Provider not found")
		return
	}

	var req BatchAddModelsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	var newModels []models.ProviderModel
	for _, m := range req.Models {
		displayName := m.DisplayName
		if displayName == "" {
			displayName = m.ModelID
		}

		newModels = append(newModels, models.ProviderModel{
			ProviderID:  provider.ID,
			ModelID:     m.ModelID,
			DisplayName: displayName,
			IsDefault:   req.DefaultModelID == m.ModelID,
			Enabled:     true,
		})
	}

	if err := h.modelRepo.BatchCreate(newModels); err != nil {
		utils.SendError(c, http.StatusInternalServerError, "create_error", "Failed to add models")
		return
	}

	c.JSON(http.StatusCreated, gin.H{"models": newModels})
}

// SetDefault sets a model as the default
func (h *ProviderModelHandler) SetDefault(c *gin.Context) {
	userID := middleware.GetUserID(c)
	providerID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid provider ID")
		return
	}

	modelID, err := uuid.Parse(c.Param("modelId"))
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid model ID")
		return
	}

	_, err = h.providerRepo.FindByIDAndUserID(providerID, userID)
	if err != nil {
		utils.SendError(c, http.StatusNotFound, "not_found", "Provider not found")
		return
	}

	if err := h.modelRepo.SetDefault(providerID, modelID); err != nil {
		utils.SendError(c, http.StatusInternalServerError, "update_error", "Failed to set default model")
		return
	}

	model, _ := h.modelRepo.FindByID(modelID)
	c.JSON(http.StatusOK, gin.H{"model": model})
}
