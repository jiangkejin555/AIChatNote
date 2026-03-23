package handlers

import (
	"encoding/json"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/ai-chat-notes/backend/internal/config"
	"github.com/ai-chat-notes/backend/internal/crypto"
	"github.com/ai-chat-notes/backend/internal/database"
	"github.com/ai-chat-notes/backend/internal/middleware"
	"github.com/ai-chat-notes/backend/internal/models"
	"github.com/ai-chat-notes/backend/internal/testutil"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupAuthTest(t *testing.T) (*gin.Engine, *config.Config, func()) {
	gin.SetMode(gin.TestMode)
	cleanup := testutil.SetupTestDB(t)

	cfg := testutil.TestConfig()
	jwtService := crypto.NewJWTService(cfg)
	authHandler := NewAuthHandler(jwtService)

	router := gin.New()
	router.POST("/api/auth/register", authHandler.Register)
	router.POST("/api/auth/login", authHandler.Login)
	router.POST("/api/auth/refresh", authHandler.Refresh)
	router.POST("/api/auth/logout", authHandler.Logout)

	protected := router.Group("/api")
	protected.Use(middleware.Auth(jwtService))
	protected.GET("/auth/me", authHandler.GetCurrentUser)

	return router, cfg, cleanup
}

func TestAuthHandler_Register(t *testing.T) {
	router, _, cleanup := setupAuthTest(t)
	defer cleanup()

	t.Run("should register successfully with valid credentials", func(t *testing.T) {
		body := `{"email": "register@example.com", "password": "password123"}`
		req := httptest.NewRequest("POST", "/api/auth/register", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		require.Equal(t, 201, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.NotEmpty(t, response["token"])
		assert.NotEmpty(t, response["refresh_token"])
	})

	t.Run("should return error when email is invalid", func(t *testing.T) {
		body := `{"email": "invalid", "password": "password123"}`
		req := httptest.NewRequest("POST", "/api/auth/register", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, 400, w.Code)
	})

	t.Run("should return error when password is too short", func(t *testing.T) {
		body := `{"email": "short@example.com", "password": "123"}`
		req := httptest.NewRequest("POST", "/api/auth/register", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, 400, w.Code)
	})

	t.Run("should return error when email already exists", func(t *testing.T) {
		// First registration
		body := `{"email": "duplicate@example.com", "password": "password123"}`
		req := httptest.NewRequest("POST", "/api/auth/register", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Second registration with same email
		req = httptest.NewRequest("POST", "/api/auth/register", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w = httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, 409, w.Code)
	})
}

func TestAuthHandler_Login(t *testing.T) {
	router, _, cleanup := setupAuthTest(t)
	defer cleanup()

	// Create a user
	hashedPassword, _ := crypto.HashPassword("password123")
	user := &models.User{
		Email:        "login@example.com",
		PasswordHash: hashedPassword,
	}
	require.NoError(t, database.DB.Create(user).Error)

	t.Run("should login successfully with correct credentials", func(t *testing.T) {
		body := `{"email": "login@example.com", "password": "password123"}`
		req := httptest.NewRequest("POST", "/api/auth/login", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.NotEmpty(t, response["token"])
	})

	t.Run("should return error with wrong password", func(t *testing.T) {
		body := `{"email": "login@example.com", "password": "wrongpassword"}`
		req := httptest.NewRequest("POST", "/api/auth/login", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, 401, w.Code)
	})

	t.Run("should return error when user not found", func(t *testing.T) {
		body := `{"email": "nonexistent@example.com", "password": "password123"}`
		req := httptest.NewRequest("POST", "/api/auth/login", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, 401, w.Code)
	})
}

func TestAuthHandler_GetCurrentUser(t *testing.T) {
	router, cfg, cleanup := setupAuthTest(t)
	defer cleanup()

	// Create a user
	user := testutil.CreateTestUser(t, "me@example.com", "hash")

	t.Run("should return current user with valid token", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "GET", "/api/auth/me", nil, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.Equal(t, "me@example.com", response["email"])
	})

	t.Run("should return error without token", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/auth/me", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, 401, w.Code)
	})
}

func TestAuthHandler_Logout(t *testing.T) {
	router, _, cleanup := setupAuthTest(t)
	defer cleanup()

	t.Run("should logout successfully", func(t *testing.T) {
		body := `{"refresh_token": "some_token"}`
		req := httptest.NewRequest("POST", "/api/auth/logout", strings.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, 200, w.Code)
	})

	t.Run("should logout successfully even without refresh token", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/api/auth/logout", nil)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, 200, w.Code)
	})
}
