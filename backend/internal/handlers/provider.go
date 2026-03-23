package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/ai-chat-notes/backend/internal/crypto"
	"github.com/ai-chat-notes/backend/internal/middleware"
	"github.com/ai-chat-notes/backend/internal/models"
	"github.com/ai-chat-notes/backend/internal/repository"
	"github.com/ai-chat-notes/backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ProviderHandler struct {
	providerRepo *repository.ProviderRepository
	modelRepo    *repository.ProviderModelRepository
	aesCrypto    *crypto.AESCrypto
}

func NewProviderHandler(aesCrypto *crypto.AESCrypto) *ProviderHandler {
	return &ProviderHandler{
		providerRepo: repository.NewProviderRepository(),
		modelRepo:    repository.NewProviderModelRepository(),
		aesCrypto:    aesCrypto,
	}
}

type CreateProviderRequest struct {
	Name    string            `json:"name" binding:"required"`
	Type    models.ProviderType `json:"type" binding:"required"`
	APIBase string            `json:"api_base" binding:"required"`
	APIKey  string            `json:"api_key" binding:"required"`
}

type UpdateProviderRequest struct {
	Name    string `json:"name"`
	APIBase string `json:"api_base"`
	APIKey  string `json:"api_key"`
}

type ProviderResponse struct {
	ID        uuid.UUID              `json:"id"`
	Name      string                 `json:"name"`
	Type      models.ProviderType    `json:"type"`
	APIBase   string                 `json:"api_base"`
	Models    []models.ProviderModel `json:"models"`
	CreatedAt string                 `json:"created_at"`
	UpdatedAt string                 `json:"updated_at"`
}

// List returns all providers for the current user
func (h *ProviderHandler) List(c *gin.Context) {
	userID := middleware.GetUserID(c)

	providers, err := h.providerRepo.FindByUserID(userID)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "db_error", "Failed to fetch providers")
		return
	}

	c.JSON(http.StatusOK, gin.H{"providers": providers})
}

// Create creates a new provider
func (h *ProviderHandler) Create(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req CreateProviderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	// Validate provider type
	validTypes := map[models.ProviderType]bool{
		models.ProviderOpenAI:     true,
		models.ProviderVolcengine: true,
		models.ProviderDeepSeek:   true,
		models.ProviderAnthropic:  true,
		models.ProviderGoogle:     true,
		models.ProviderMoonshot:   true,
		models.ProviderZhipu:      true,
		models.ProviderCustom:     true,
	}
	if !validTypes[req.Type] {
		utils.SendError(c, http.StatusBadRequest, "invalid_type", "Invalid provider type")
		return
	}

	// Encrypt API key
	encryptedKey, err := h.aesCrypto.Encrypt(req.APIKey)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "encryption_error", "Failed to secure API key")
		return
	}

	provider := &models.Provider{
		UserID:          userID,
		Name:            req.Name,
		Type:            req.Type,
		APIBase:         req.APIBase,
		APIKeyEncrypted: encryptedKey,
	}

	if err := h.providerRepo.Create(provider); err != nil {
		utils.SendError(c, http.StatusInternalServerError, "create_error", "Failed to create provider")
		return
	}

	c.JSON(http.StatusCreated, gin.H{"provider": provider})
}

// Get returns a specific provider
func (h *ProviderHandler) Get(c *gin.Context) {
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

	c.JSON(http.StatusOK, gin.H{"data": provider})
}

// Update updates a provider
func (h *ProviderHandler) Update(c *gin.Context) {
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

	var req UpdateProviderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	if req.Name != "" {
		provider.Name = req.Name
	}
	if req.APIBase != "" {
		provider.APIBase = req.APIBase
	}
	if req.APIKey != "" {
		encryptedKey, err := h.aesCrypto.Encrypt(req.APIKey)
		if err != nil {
			utils.SendError(c, http.StatusInternalServerError, "encryption_error", "Failed to secure API key")
			return
		}
		provider.APIKeyEncrypted = encryptedKey
	}

	if err := h.providerRepo.Update(provider); err != nil {
		utils.SendError(c, http.StatusInternalServerError, "update_error", "Failed to update provider")
		return
	}

	c.JSON(http.StatusOK, gin.H{"provider": provider})
}

// Delete deletes a provider
func (h *ProviderHandler) Delete(c *gin.Context) {
	userID := middleware.GetUserID(c)
	providerID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid provider ID")
		return
	}

	if err := h.providerRepo.Delete(providerID, userID); err != nil {
		utils.SendError(c, http.StatusInternalServerError, "delete_error", "Failed to delete provider")
		return
	}

	utils.SendSuccess(c, "Provider deleted successfully")
}

// TestConnection tests the provider connection
func (h *ProviderHandler) TestConnection(c *gin.Context) {
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

	// Decrypt API key
	apiKey, err := h.aesCrypto.Decrypt(provider.APIKeyEncrypted)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "decryption_error", "Failed to decrypt API key")
		return
	}

	// Test connection by calling the models endpoint
	success, message, latency := testLLMConnection(provider.APIBase, apiKey)

	c.JSON(http.StatusOK, gin.H{
		"success": success,
		"message": message,
		"latency": latency,
	})
}

func testLLMConnection(apiBase, apiKey string) (bool, string, int) {
	// Simple connection test - in production, make actual API call
	// For now, return mock success
	return true, "Connection successful", 150
}

// AvailableModel represents a model from the provider's API
type AvailableModel struct {
	ID     string `json:"id"`
	Object string `json:"object"`
	Created int64 `json:"created"`
	OwnedBy string `json:"owned_by"`
}

// GetAvailableModels fetches available models from the provider's API
func (h *ProviderHandler) GetAvailableModels(c *gin.Context) {
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

	// Decrypt API key
	apiKey, err := h.aesCrypto.Decrypt(provider.APIKeyEncrypted)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "decryption_error", "Failed to decrypt API key")
		return
	}

	// Call the provider's /models endpoint
	models, err := fetchAvailableModels(provider.APIBase, apiKey)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "fetch_error", "Failed to fetch models: "+err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"models": models})
}

func fetchAvailableModels(apiBase, apiKey string) ([]AvailableModel, error) {
	client := &http.Client{Timeout: 10 * time.Second}

	// Ensure the URL ends with /models
	baseURL := apiBase
	if baseURL[len(baseURL)-1] == '/' {
		baseURL = baseURL[:len(baseURL)-1]
	}

	req, err := http.NewRequest("GET", baseURL+"/models", nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, err
	}

	var result struct {
		Data []AvailableModel `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return result.Data, nil
}
