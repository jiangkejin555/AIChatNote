package handlers

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/chat-note/backend/internal/config"
	"github.com/chat-note/backend/internal/crypto"
	"github.com/chat-note/backend/internal/middleware"
	"github.com/chat-note/backend/internal/services"
	"github.com/chat-note/backend/internal/testutil"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupUserSettingsTest(t *testing.T) (*gin.Engine, *config.Config, *services.ContextConfigService, func()) {
	gin.SetMode(gin.TestMode)
	cleanup := testutil.SetupTestDB(t)

	cfg := testutil.TestConfig()
	// Set context config defaults
	cfg.Context = config.ContextConfig{
		DefaultMode:  "simple",
		DefaultLevel: "normal",
		Summary: config.ContextSummaryConfig{
			MaxTokens: 300,
			Short: config.ContextSummaryParams{
				WindowAutoSize:  10,
				KeepRecentCount: 5,
			},
			Normal: config.ContextSummaryParams{
				WindowAutoSize:  20,
				KeepRecentCount: 10,
			},
			Long: config.ContextSummaryParams{
				WindowAutoSize:  40,
				KeepRecentCount: 20,
			},
		},
		Simple: config.ContextSimpleConfig{
			Short:  config.ContextSimpleParams{HistoryLimit: 5},
			Normal: config.ContextSimpleParams{HistoryLimit: 10},
			Long:   config.ContextSimpleParams{HistoryLimit: 15},
		},
	}

	contextService := services.NewContextConfigService(cfg)
	handler := NewUserSettingsHandler(contextService)

	jwtService := crypto.NewJWTService(cfg)

	router := gin.New()
	protected := router.Group("/api")
	protected.Use(middleware.Auth(jwtService))
	{
		protected.GET("/user/settings", handler.GetUserSettings)
		protected.PUT("/user/settings", handler.UpdateUserSettings)
	}

	return router, cfg, contextService, cleanup
}

func TestUserSettingsHandler_GetUserSettings(t *testing.T) {
	router, cfg, _, cleanup := setupUserSettingsTest(t)
	defer cleanup()

	t.Run("returns default settings for new user", func(t *testing.T) {
		user := testutil.CreateTestUser(t, "test1@example.com", "hash123")

		w := testutil.MakeAuthenticatedRequest(router, "GET", "/api/user/settings", nil, user.ID, cfg)

		require.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].(map[string]interface{})

		assert.Equal(t, "simple", data["context_mode"])
		assert.Equal(t, "normal", data["memory_level"])
	})

	t.Run("returns existing settings for user", func(t *testing.T) {
		user := testutil.CreateTestUser(t, "test2@example.com", "hash123")

		// First, update settings
		updateBody := map[string]interface{}{
			"context_mode":  "summary",
			"memory_level": "long",
		}
		testutil.MakeAuthenticatedRequest(router, "PUT", "/api/user/settings", updateBody, user.ID, cfg)

		// Then, get settings
		w := testutil.MakeAuthenticatedRequest(router, "GET", "/api/user/settings", nil, user.ID, cfg)

		require.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].(map[string]interface{})

		assert.Equal(t, "summary", data["context_mode"])
		assert.Equal(t, "long", data["memory_level"])
	})

	t.Run("requires authentication", func(t *testing.T) {
		w := testutil.MakeRequest(router, "GET", "/api/user/settings", nil)
		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})
}

func TestUserSettingsHandler_UpdateUserSettings(t *testing.T) {
	router, cfg, _, cleanup := setupUserSettingsTest(t)
	defer cleanup()

	t.Run("updates context mode", func(t *testing.T) {
		user := testutil.CreateTestUser(t, "test3@example.com", "hash123")

		body := map[string]interface{}{
			"context_mode": "summary",
		}
		w := testutil.MakeAuthenticatedRequest(router, "PUT", "/api/user/settings", body, user.ID, cfg)

		require.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].(map[string]interface{})

		assert.Equal(t, "summary", data["context_mode"])
	})

	t.Run("updates memory level", func(t *testing.T) {
		user := testutil.CreateTestUser(t, "test4@example.com", "hash123")

		body := map[string]interface{}{
			"memory_level": "short",
		}
		w := testutil.MakeAuthenticatedRequest(router, "PUT", "/api/user/settings", body, user.ID, cfg)

		require.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].(map[string]interface{})

		assert.Equal(t, "short", data["memory_level"])
	})

	t.Run("updates both settings", func(t *testing.T) {
		user := testutil.CreateTestUser(t, "test5@example.com", "hash123")

		body := map[string]interface{}{
			"context_mode":  "summary",
			"memory_level":  "long",
		}
		w := testutil.MakeAuthenticatedRequest(router, "PUT", "/api/user/settings", body, user.ID, cfg)

		require.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].(map[string]interface{})

		assert.Equal(t, "summary", data["context_mode"])
		assert.Equal(t, "long", data["memory_level"])
	})

	t.Run("returns error for invalid context mode", func(t *testing.T) {
		user := testutil.CreateTestUser(t, "test6@example.com", "hash123")

		body := map[string]interface{}{
			"context_mode": "invalid",
		}
		w := testutil.MakeAuthenticatedRequest(router, "PUT", "/api/user/settings", body, user.ID, cfg)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("returns error for invalid memory level", func(t *testing.T) {
		user := testutil.CreateTestUser(t, "test7@example.com", "hash123")

		body := map[string]interface{}{
			"memory_level": "invalid",
		}
		w := testutil.MakeAuthenticatedRequest(router, "PUT", "/api/user/settings", body, user.ID, cfg)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("requires authentication", func(t *testing.T) {
		w := testutil.MakeRequest(router, "PUT", "/api/user/settings", map[string]interface{}{})
		assert.Equal(t, http.StatusUnauthorized, w.Code)
	})

	t.Run("persists settings across requests", func(t *testing.T) {
		user := testutil.CreateTestUser(t, "test8@example.com", "hash123")

		// Update settings
		body := map[string]interface{}{
			"context_mode":  "summary",
			"memory_level":  "short",
		}
		w := testutil.MakeAuthenticatedRequest(router, "PUT", "/api/user/settings", body, user.ID, cfg)
		require.Equal(t, http.StatusOK, w.Code)

		// Get settings to verify persistence
		w = testutil.MakeAuthenticatedRequest(router, "GET", "/api/user/settings", nil, user.ID, cfg)
		require.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].(map[string]interface{})

		assert.Equal(t, "summary", data["context_mode"])
		assert.Equal(t, "short", data["memory_level"])
	})
}
