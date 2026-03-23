package middleware

import (
	"net/http/httptest"
	"testing"

	"github.com/chat-note/backend/internal/crypto"
	"github.com/chat-note/backend/internal/models"
	"github.com/chat-note/backend/internal/testutil"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAuth(t *testing.T) {
	gin.SetMode(gin.TestMode)

	cfg := testutil.TestConfig()
	jwtService := crypto.NewJWTService(cfg)

	t.Run("should reject request without authorization header", func(t *testing.T) {
		router := gin.New()
		router.Use(Auth(jwtService))
		router.GET("/protected", func(c *gin.Context) {
			c.JSON(200, gin.H{"message": "ok"})
		})

		req := httptest.NewRequest("GET", "/protected", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, 401, w.Code)
	})

	t.Run("should reject request with invalid authorization format", func(t *testing.T) {
		router := gin.New()
		router.Use(Auth(jwtService))
		router.GET("/protected", func(c *gin.Context) {
			c.JSON(200, gin.H{"message": "ok"})
		})

		req := httptest.NewRequest("GET", "/protected", nil)
		req.Header.Set("Authorization", "InvalidFormat token")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, 401, w.Code)
	})

	t.Run("should reject request with invalid token", func(t *testing.T) {
		router := gin.New()
		router.Use(Auth(jwtService))
		router.GET("/protected", func(c *gin.Context) {
			c.JSON(200, gin.H{"message": "ok"})
		})

		req := httptest.NewRequest("GET", "/protected", nil)
		req.Header.Set("Authorization", "Bearer invalid-token")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, 401, w.Code)
	})

	t.Run("should allow request with valid token", func(t *testing.T) {
		router := gin.New()
		router.Use(Auth(jwtService))
		router.GET("/protected", func(c *gin.Context) {
			c.JSON(200, gin.H{"message": "ok", "user_id": GetUserID(c)})
		})

		user := &models.User{ID: 1, Email: "test@example.com"}
		token, err := jwtService.GenerateToken(user)
		require.NoError(t, err)

		req := httptest.NewRequest("GET", "/protected", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, 200, w.Code)
	})

	t.Run("should extract user info from context", func(t *testing.T) {
		router := gin.New()
		router.Use(Auth(jwtService))
		router.GET("/protected", func(c *gin.Context) {
			userID := GetUserID(c)
			email := GetEmail(c)
			c.JSON(200, gin.H{"user_id": userID, "email": email})
		})

		user := &models.User{ID: 123, Email: "context@example.com"}
		token, err := jwtService.GenerateToken(user)
		require.NoError(t, err)

		req := httptest.NewRequest("GET", "/protected", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, 200, w.Code)
		// Response contains correct user info
		assert.Contains(t, w.Body.String(), "123")
		assert.Contains(t, w.Body.String(), "context@example.com")
	})

	t.Run("should return 0 for GetUserID when not set", func(t *testing.T) {
		router := gin.New()
		router.GET("/test", func(c *gin.Context) {
			userID := GetUserID(c)
			c.JSON(200, gin.H{"user_id": userID})
		})

		req := httptest.NewRequest("GET", "/test", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, 200, w.Code)
		assert.Contains(t, w.Body.String(), `"user_id":0`)
	})

	t.Run("should return empty string for GetEmail when not set", func(t *testing.T) {
		router := gin.New()
		router.GET("/test", func(c *gin.Context) {
			email := GetEmail(c)
			c.JSON(200, gin.H{"email": email})
		})

		req := httptest.NewRequest("GET", "/test", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, 200, w.Code)
		assert.Contains(t, w.Body.String(), `"email":""`)
	})
}
