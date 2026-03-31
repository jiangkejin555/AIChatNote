package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/chat-note/backend/internal/crypto"
	"github.com/chat-note/backend/internal/middleware"
	"github.com/chat-note/backend/internal/models"
	"github.com/chat-note/backend/internal/repository"
	"github.com/chat-note/backend/internal/utils"
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
	Name    string              `json:"name" binding:"required"`
	Type    models.ProviderType `json:"type" binding:"required"`
	APIBase string              `json:"api_base" binding:"required"`
	APIKey  string              `json:"api_key" binding:"required"`
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
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "db_error", "Failed to fetch providers", err)
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
		utils.LogOperationError("ProviderHandler", "Create", err, "userID", userID, "step", "encrypt_api_key")
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "encryption_error", "Failed to secure API key", err)
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
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "create_error", "Failed to create provider", err)
		return
	}

	utils.LogOperationSuccess("ProviderHandler", "Create", "providerID", provider.ID, "userID", userID, "type", req.Type, "name", req.Name)
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
		utils.SendErrorWithErr(c, http.StatusNotFound, "not_found", "Provider not found", err)
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
		utils.SendErrorWithErr(c, http.StatusNotFound, "not_found", "Provider not found", err)
		return
	}

	var req UpdateProviderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	updatedFields := []string{}
	if req.Name != "" {
		provider.Name = req.Name
		updatedFields = append(updatedFields, "name")
	}
	if req.APIBase != "" {
		provider.APIBase = req.APIBase
		updatedFields = append(updatedFields, "api_base")
	}
	if req.APIKey != "" {
		encryptedKey, err := h.aesCrypto.Encrypt(req.APIKey)
		if err != nil {
			utils.LogOperationError("ProviderHandler", "Update", err, "providerID", providerID, "step", "encrypt_api_key")
			utils.SendErrorWithErr(c, http.StatusInternalServerError, "encryption_error", "Failed to secure API key", err)
			return
		}
		provider.APIKeyEncrypted = encryptedKey
		updatedFields = append(updatedFields, "api_key")
	}

	if err := h.providerRepo.Update(provider); err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "update_error", "Failed to update provider", err)
		return
	}

	utils.LogOperationSuccess("ProviderHandler", "Update", "providerID", providerID, "userID", userID, "fields", updatedFields)
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
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "delete_error", "Failed to delete provider", err)
		return
	}

	utils.LogOperationSuccess("ProviderHandler", "Delete", "providerID", providerID, "userID", userID)
	utils.SendSuccess(c, "Provider deleted successfully")
}

// TestConnectionRequest represents the request body for testing connection
type TestConnectionRequest struct {
	ModelID string `json:"model_id"`
}

// TestConnection tests the provider connection for a specific model
func (h *ProviderHandler) TestConnection(c *gin.Context) {
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

	// Parse request body to get model_id
	var req TestConnectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// If no body, return error - model_id is required
		utils.SendError(c, http.StatusBadRequest, "invalid_request", "model_id is required")
		return
	}

	if req.ModelID == "" {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", "model_id is required")
		return
	}

	// Decrypt API key
	apiKey, err := h.aesCrypto.Decrypt(provider.APIKeyEncrypted)
	if err != nil {
		utils.LogOperationError("ProviderHandler", "TestConnection", err, "providerID", providerID, "step", "decrypt_api_key")
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "decryption_error", "Failed to decrypt API key", err)
		return
	}

	// Test connection by sending a minimal chat completion request
	start := time.Now()
	success, message, latency := testModelConnection(provider.APIBase, apiKey, req.ModelID)
	totalLatency := time.Since(start)

	utils.LogLatency("ProviderHandler", "TestConnection", totalLatency, "providerID", providerID, "modelID", req.ModelID, "success", success, "message", message)

	c.JSON(http.StatusOK, gin.H{
		"success": success,
		"message": message,
		"latency": latency,
	})
}

// testModelConnection tests connection to a specific model by sending a minimal chat completion request
func testModelConnection(apiBase, apiKey, modelID string) (bool, string, int) {
	client := &http.Client{Timeout: 30 * time.Second}

	// Ensure the URL ends with /chat/completions
	baseURL := apiBase
	if len(baseURL) > 0 && baseURL[len(baseURL)-1] == '/' {
		baseURL = baseURL[:len(baseURL)-1]
	}

	// Create a minimal chat completion request
	requestBody := map[string]interface{}{
		"model": modelID,
		"messages": []map[string]string{
			{"role": "user", "content": "Hi"},
		},
		"max_tokens": 1, // Minimal token limit to reduce cost
	}

	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return false, "Failed to create request body: " + err.Error(), 0
	}

	start := time.Now()
	req, err := http.NewRequest("POST", baseURL+"/chat/completions", bytes.NewReader(jsonBody))
	if err != nil {
		return false, "Failed to create request: " + err.Error(), 0
	}

	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req) // ignore_security_alert
	if err != nil {
		return false, "Connection failed: " + err.Error(), int(time.Since(start).Milliseconds())
	}
	defer resp.Body.Close()

	latency := int(time.Since(start).Milliseconds())

	// Read response body for error details
	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode == http.StatusOK {
		return true, "Connection successful", latency
	}

	// Try to parse error message from response
	var errResp struct {
		Error struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.Unmarshal(body, &errResp); err == nil && errResp.Error.Message != "" {
		return false, errResp.Error.Message, latency
	}

	return false, fmt.Sprintf("API returned status %d: %s", resp.StatusCode, string(body)), latency
}

// AvailableModel represents a model from the provider's API
type AvailableModel struct {
	ID      string `json:"id"`
	Object  string `json:"object"`
	Created int64  `json:"created"`
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
		utils.LogOperationError("ProviderHandler", "GetAvailableModels", err, "providerID", providerID, "step", "decrypt_api_key")
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "decryption_error", "Failed to decrypt API key", err)
		return
	}

	// Call the provider's /models endpoint
	start := time.Now()
	models, err := fetchAvailableModels(provider.APIBase, apiKey)
	latency := time.Since(start)

	if err != nil {
		utils.LogExternalCallError("ProviderHandler", string(provider.Type), err, "providerID", providerID, "latency_ms", latency.Milliseconds())
		utils.SendError(c, http.StatusInternalServerError, "fetch_error", "Failed to fetch models: "+err.Error())
		return
	}

	utils.LogExternalCall("ProviderHandler", string(provider.Type), "models_list", latency, "providerID", providerID, "model_count", len(models))
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
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(body))
	}

	var result struct {
		Data []AvailableModel `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return result.Data, nil
}
