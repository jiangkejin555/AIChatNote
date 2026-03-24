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
	IsDefault   bool   `json:"is_default"` // Used in sync to set default for new models
}

type BatchAddModelsRequest struct {
	Models         []AddModelRequest `json:"models" binding:"required"`
	DefaultModelID string            `json:"default_model_id"`
}

type UpdateModelRequest struct {
	DisplayName string `json:"display_name"`
	IsDefault   *bool  `json:"is_default"`
	Enabled     *bool  `json:"enabled"`
}

// SyncModelsRequest represents the request body for syncing provider models
type SyncModelsRequest struct {
	Add            []AddModelRequest `json:"add"`
	Delete         []string          `json:"delete"`           // provider_model IDs to delete (hard delete)
	Enable         []string          `json:"enable"`           // provider_model IDs to enable
	Disable        []string          `json:"disable"`          // provider_model IDs to disable
	DefaultModelID string            `json:"default_model_id"` // provider_model ID to set as default
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
		utils.SendErrorWithErr(c, http.StatusNotFound, "not_found", "Provider not found", err)
		return
	}

	models, err := h.modelRepo.FindByProviderID(provider.ID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "db_error", "Failed to fetch models", err)
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
		utils.SendErrorWithErr(c, http.StatusNotFound, "not_found", "Provider not found", err)
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
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "create_error", "Failed to add model", err)
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
		utils.SendErrorWithErr(c, http.StatusNotFound, "not_found", "Provider not found", err)
		return
	}

	model, err := h.modelRepo.FindByIDAndProviderID(modelID, providerID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusNotFound, "not_found", "Model not found", err)
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
	if req.IsDefault != nil {
		model.IsDefault = *req.IsDefault
	}
	if req.Enabled != nil {
		model.Enabled = *req.Enabled
	}
	model.UpdatedAt = time.Now()

	if err := h.modelRepo.Update(model); err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "update_error", "Failed to update model", err)
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
		utils.SendErrorWithErr(c, http.StatusNotFound, "not_found", "Provider not found", err)
		return
	}

	if err := h.modelRepo.Delete(modelID, providerID); err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "delete_error", "Failed to delete model", err)
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
		utils.SendErrorWithErr(c, http.StatusNotFound, "not_found", "Provider not found", err)
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
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "create_error", "Failed to add models", err)
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
		utils.SendErrorWithErr(c, http.StatusNotFound, "not_found", "Provider not found", err)
		return
	}

	if err := h.modelRepo.SetDefault(providerID, modelID); err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "update_error", "Failed to set default model", err)
		return
	}

	model, _ := h.modelRepo.FindByID(modelID)
	c.JSON(http.StatusOK, gin.H{"model": model})
}

// Sync syncs provider models (add, delete, enable, disable, update default in one transaction)
func (h *ProviderModelHandler) Sync(c *gin.Context) {
	userID := middleware.GetUserID(c)
	providerID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid provider ID")
		return
	}

	provider, err := h.providerRepo.FindByIDAndUserID(providerID, userID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusNotFound, "not_found", "Provider not found", err)
		return
	}

	var req SyncModelsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	// Validate: same model cannot be in both enable and disable lists
	enableSet := make(map[string]bool)
	for _, id := range req.Enable {
		enableSet[id] = true
	}
	for _, id := range req.Disable {
		if enableSet[id] {
			utils.SendError(c, http.StatusBadRequest, "invalid_request", "Model cannot be in both enable and disable lists: "+id)
			return
		}
	}

	// Convert request to repository params
	var modelsToAdd []models.ProviderModel
	var newDefaultModelIndex int = -1
	for i, m := range req.Add {
		displayName := m.DisplayName
		if displayName == "" {
			displayName = m.ModelID
		}
		modelsToAdd = append(modelsToAdd, models.ProviderModel{
			ProviderID:  provider.ID,
			ModelID:     m.ModelID,
			DisplayName: displayName,
			Enabled:     true,
		})
		if m.IsDefault {
			newDefaultModelIndex = i
		}
	}

	var deleteIDs []uuid.UUID
	for _, idStr := range req.Delete {
		id, err := uuid.Parse(idStr)
		if err != nil {
			utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid model ID in delete list: "+idStr)
			return
		}
		deleteIDs = append(deleteIDs, id)
	}

	var enableIDs []uuid.UUID
	for _, idStr := range req.Enable {
		id, err := uuid.Parse(idStr)
		if err != nil {
			utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid model ID in enable list: "+idStr)
			return
		}
		enableIDs = append(enableIDs, id)
	}

	var disableIDs []uuid.UUID
	for _, idStr := range req.Disable {
		id, err := uuid.Parse(idStr)
		if err != nil {
			utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid model ID in disable list: "+idStr)
			return
		}
		disableIDs = append(disableIDs, id)
	}

	var defaultModelID uuid.UUID
	if req.DefaultModelID != "" {
		defaultModelID, err = uuid.Parse(req.DefaultModelID)
		if err != nil {
			utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid default model ID")
			return
		}
	}

	// Execute sync in transaction
	result, err := h.modelRepo.Sync(provider.ID, modelsToAdd, deleteIDs, defaultModelID, newDefaultModelIndex, enableIDs, disableIDs)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "sync_error", "Failed to sync models: "+err.Error(), err)
		return
	}

	c.JSON(http.StatusOK, result)
}
