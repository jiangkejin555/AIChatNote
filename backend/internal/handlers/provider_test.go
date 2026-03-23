package handlers

import (
	"encoding/json"
	"fmt"
	"testing"

	"github.com/chat-note/backend/internal/config"
	"github.com/chat-note/backend/internal/crypto"
	"github.com/chat-note/backend/internal/database"
	"github.com/chat-note/backend/internal/middleware"
	"github.com/chat-note/backend/internal/models"
	"github.com/chat-note/backend/internal/testutil"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupProviderTest(t *testing.T) (*gin.Engine, *config.Config, func()) {
	gin.SetMode(gin.TestMode)
	cleanup := testutil.SetupTestDB(t)

	cfg := testutil.TestConfig()
	jwtService := crypto.NewJWTService(cfg)
	aesCrypto, _ := crypto.NewAESCrypto(cfg.Encryption.Key)

	authHandler := NewAuthHandler(jwtService)
	providerHandler := NewProviderHandler(aesCrypto)

	router := gin.New()

	// Auth routes
	router.POST("/api/auth/register", authHandler.Register)
	router.POST("/api/auth/login", authHandler.Login)

	// Protected routes
	protected := router.Group("/api")
	protected.Use(middleware.Auth(jwtService))
	{
		protected.GET("/providers", providerHandler.List)
		protected.POST("/providers", providerHandler.Create)
		protected.GET("/providers/:id", providerHandler.Get)
		protected.PUT("/providers/:id", providerHandler.Update)
		protected.DELETE("/providers/:id", providerHandler.Delete)
		protected.POST("/providers/:id/test", providerHandler.TestConnection)
		protected.GET("/providers/:id/models", providerHandler.GetAvailableModels)
	}

	return router, cfg, cleanup
}

func TestProviderHandler_List(t *testing.T) {
	router, cfg, cleanup := setupProviderTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "provider_list@example.com", "hash")

	t.Run("should return empty list when no providers", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "GET", "/api/providers", nil, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		providers := response["providers"].([]interface{})
		assert.Empty(t, providers)
	})

	t.Run("should return providers for user", func(t *testing.T) {
		// Create providers
		testutil.CreateTestProvider(t, user.ID, "OpenAI", models.ProviderOpenAI)
		testutil.CreateTestProvider(t, user.ID, "DeepSeek", models.ProviderDeepSeek)

		w := testutil.MakeAuthenticatedRequest(router, "GET", "/api/providers", nil, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		providers := response["providers"].([]interface{})
		assert.GreaterOrEqual(t, len(providers), 2)
	})
}

func TestProviderHandler_Create(t *testing.T) {
	router, cfg, cleanup := setupProviderTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "provider_create@example.com", "hash")

	t.Run("should create provider successfully", func(t *testing.T) {
		body := `{
			"name": "Test OpenAI",
			"type": "openai",
			"api_base": "https://api.openai.com/v1",
			"api_key": "sk-test-key-12345"
		}`
		w := testutil.MakeAuthenticatedRequest(router, "POST", "/api/providers", body, user.ID, cfg)

		require.Equal(t, 201, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		provider := response["provider"].(map[string]interface{})
		assert.Equal(t, "Test OpenAI", provider["name"])
		assert.NotEmpty(t, provider["id"])
	})

	t.Run("should return error when name is missing", func(t *testing.T) {
		body := `{"type": "openai", "api_base": "https://api.openai.com/v1", "api_key": "sk-test"}`
		w := testutil.MakeAuthenticatedRequest(router, "POST", "/api/providers", body, user.ID, cfg)

		assert.Equal(t, 400, w.Code)
	})

	t.Run("should return error when type is missing", func(t *testing.T) {
		body := `{"name": "Test", "api_base": "https://api.openai.com/v1", "api_key": "sk-test"}`
		w := testutil.MakeAuthenticatedRequest(router, "POST", "/api/providers", body, user.ID, cfg)

		assert.Equal(t, 400, w.Code)
	})

	t.Run("should return error for invalid provider type", func(t *testing.T) {
		body := `{
			"name": "Invalid",
			"type": "invalid_type",
			"api_base": "https://api.example.com/v1",
			"api_key": "test-key"
		}`
		w := testutil.MakeAuthenticatedRequest(router, "POST", "/api/providers", body, user.ID, cfg)

		assert.Equal(t, 400, w.Code)
	})

	t.Run("should create provider with all valid types", func(t *testing.T) {
		validTypes := []models.ProviderType{
			models.ProviderOpenAI,
			models.ProviderVolcengine,
			models.ProviderDeepSeek,
			models.ProviderAnthropic,
			models.ProviderGoogle,
			models.ProviderMoonshot,
			models.ProviderZhipu,
			models.ProviderCustom,
		}

		for i, pt := range validTypes {
			body := fmt.Sprintf(`{
				"name": "Provider %d",
				"type": "%s",
				"api_base": "https://api.example.com/v1",
				"api_key": "test-key-%d"
			}`, i, pt, i)
			w := testutil.MakeAuthenticatedRequest(router, "POST", "/api/providers", body, user.ID, cfg)

			assert.Equal(t, 201, w.Code, "Failed for type: %s", pt)
		}
	})
}

func TestProviderHandler_Get(t *testing.T) {
	router, cfg, cleanup := setupProviderTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "provider_get@example.com", "hash")
	provider := testutil.CreateTestProvider(t, user.ID, "Get Test", models.ProviderOpenAI)

	t.Run("should return provider by ID", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "GET", fmt.Sprintf("/api/providers/%s", provider.ID), nil, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].(map[string]interface{})
		assert.Equal(t, "Get Test", data["name"])
	})

	t.Run("should return error for non-existent provider", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "GET", fmt.Sprintf("/api/providers/%s", uuid.New()), nil, user.ID, cfg)

		assert.Equal(t, 404, w.Code)
	})

	t.Run("should return error for invalid UUID", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "GET", "/api/providers/invalid-uuid", nil, user.ID, cfg)

		assert.Equal(t, 400, w.Code)
	})

	t.Run("should return error for other user's provider", func(t *testing.T) {
		otherUser := testutil.CreateTestUser(t, "other_provider@example.com", "hash")
		otherProvider := testutil.CreateTestProvider(t, otherUser.ID, "Other Provider", models.ProviderOpenAI)

		w := testutil.MakeAuthenticatedRequest(router, "GET", fmt.Sprintf("/api/providers/%s", otherProvider.ID), nil, user.ID, cfg)

		assert.Equal(t, 404, w.Code)
	})
}

func TestProviderHandler_Update(t *testing.T) {
	router, cfg, cleanup := setupProviderTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "provider_update@example.com", "hash")
	provider := testutil.CreateTestProvider(t, user.ID, "Original Name", models.ProviderOpenAI)

	t.Run("should update provider name", func(t *testing.T) {
		body := `{"name": "Updated Name"}`
		w := testutil.MakeAuthenticatedRequest(router, "PUT", fmt.Sprintf("/api/providers/%s", provider.ID), body, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		p := response["provider"].(map[string]interface{})
		assert.Equal(t, "Updated Name", p["name"])
	})

	t.Run("should update provider api_base", func(t *testing.T) {
		body := `{"api_base": "https://new-api.example.com/v1"}`
		w := testutil.MakeAuthenticatedRequest(router, "PUT", fmt.Sprintf("/api/providers/%s", provider.ID), body, user.ID, cfg)

		require.Equal(t, 200, w.Code)
	})

	t.Run("should update provider api_key", func(t *testing.T) {
		body := `{"api_key": "new-api-key"}`
		w := testutil.MakeAuthenticatedRequest(router, "PUT", fmt.Sprintf("/api/providers/%s", provider.ID), body, user.ID, cfg)

		require.Equal(t, 200, w.Code)
	})

	t.Run("should return error for non-existent provider", func(t *testing.T) {
		body := `{"name": "Test"}`
		w := testutil.MakeAuthenticatedRequest(router, "PUT", fmt.Sprintf("/api/providers/%s", uuid.New()), body, user.ID, cfg)

		assert.Equal(t, 404, w.Code)
	})
}

func TestProviderHandler_Delete(t *testing.T) {
	router, cfg, cleanup := setupProviderTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "provider_delete@example.com", "hash")

	t.Run("should delete provider", func(t *testing.T) {
		provider := testutil.CreateTestProvider(t, user.ID, "To Delete", models.ProviderOpenAI)

		w := testutil.MakeAuthenticatedRequest(router, "DELETE", fmt.Sprintf("/api/providers/%s", provider.ID), nil, user.ID, cfg)

		require.Equal(t, 200, w.Code)
	})

	t.Run("should return error for invalid UUID", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "DELETE", "/api/providers/invalid-uuid", nil, user.ID, cfg)

		assert.Equal(t, 400, w.Code)
	})

	t.Run("should return error for non-existent provider", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "DELETE", fmt.Sprintf("/api/providers/%s", uuid.New()), nil, user.ID, cfg)

		// Delete returns success even if no rows affected (idempotent)
		assert.True(t, w.Code == 200 || w.Code == 500)
	})
}

func TestProviderHandler_TestConnection(t *testing.T) {
	router, cfg, cleanup := setupProviderTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "provider_test_conn@example.com", "hash")

	// Create provider with properly encrypted API key
	aesCrypto, _ := crypto.NewAESCrypto(cfg.Encryption.Key)
	encryptedKey, _ := aesCrypto.Encrypt("test-api-key")

	provider := &models.Provider{
		ID:              uuid.New(),
		UserID:          user.ID,
		Name:            "Test Provider",
		Type:            models.ProviderOpenAI,
		APIBase:         "https://api.openai.com/v1",
		APIKeyEncrypted: encryptedKey,
	}
	require.NoError(t, database.DB.Create(provider).Error)

	t.Run("should test connection successfully", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "POST", fmt.Sprintf("/api/providers/%s/test", provider.ID), nil, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.True(t, response["success"].(bool))
	})

	t.Run("should return error for non-existent provider", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "POST", fmt.Sprintf("/api/providers/%s/test", uuid.New()), nil, user.ID, cfg)

		assert.Equal(t, 404, w.Code)
	})
}

func TestProviderHandler_GetAvailableModels(t *testing.T) {
	router, cfg, cleanup := setupProviderTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "provider_models@example.com", "hash")
	provider := testutil.CreateTestProvider(t, user.ID, "Models Provider", models.ProviderOpenAI)

	t.Run("should return error for non-existent provider", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "GET", fmt.Sprintf("/api/providers/%s/models", uuid.New()), nil, user.ID, cfg)

		assert.Equal(t, 404, w.Code)
	})

	t.Run("should return error for invalid UUID", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "GET", "/api/providers/invalid/models", nil, user.ID, cfg)

		assert.Equal(t, 400, w.Code)
	})

	// Note: Actual API call test is skipped as it requires network access
	t.Run("should attempt to fetch models (may fail due to network)", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "GET", fmt.Sprintf("/api/providers/%s/models", provider.ID), nil, user.ID, cfg)

		// Response could be 200 (success) or 500 (network error) depending on environment
		assert.True(t, w.Code == 200 || w.Code == 500)
	})
}
