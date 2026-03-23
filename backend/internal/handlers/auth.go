package handlers

import (
	"net/http"

	"github.com/chat-note/backend/internal/crypto"
	"github.com/chat-note/backend/internal/middleware"
	"github.com/chat-note/backend/internal/models"
	"github.com/chat-note/backend/internal/repository"
	"github.com/chat-note/backend/internal/utils"
	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	userRepo         *repository.UserRepository
	refreshTokenRepo *repository.RefreshTokenRepository
	jwtService       *crypto.JWTService
}

func NewAuthHandler(jwtService *crypto.JWTService) *AuthHandler {
	return &AuthHandler{
		userRepo:         repository.NewUserRepository(),
		refreshTokenRepo: repository.NewRefreshTokenRepository(),
		jwtService:       jwtService,
	}
}

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type AuthResponse struct {
	Token        string       `json:"token"`
	RefreshToken string       `json:"refresh_token"`
	User         *models.User `json:"user"`
}

// Register handles user registration
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	// Check if user exists
	if existingUser, _ := h.userRepo.FindByEmail(req.Email); existingUser != nil {
		utils.SendError(c, http.StatusConflict, "email_exists", "Email already registered")
		return
	}

	// Hash password
	passwordHash, err := crypto.HashPassword(req.Password)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "hash_error", "Failed to secure password")
		return
	}

	// Create user
	user := &models.User{
		Email:        req.Email,
		PasswordHash: passwordHash,
	}
	if err := h.userRepo.Create(user); err != nil {
		utils.SendError(c, http.StatusInternalServerError, "create_error", "Failed to create user")
		return
	}

	// Generate tokens
	token, err := h.jwtService.GenerateToken(user)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "token_error", "Failed to generate token")
		return
	}

	refreshToken, expiresAt, err := h.jwtService.GenerateRefreshToken()
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "token_error", "Failed to generate refresh token")
		return
	}

	// Save refresh token
	rt := &models.RefreshToken{
		UserID:    user.ID,
		TokenHash: refreshToken,
		ExpiresAt: expiresAt,
	}
	if err := h.refreshTokenRepo.Create(rt); err != nil {
		utils.SendError(c, http.StatusInternalServerError, "token_error", "Failed to save refresh token")
		return
	}

	c.JSON(http.StatusCreated, AuthResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         user,
	})
}

// Login handles user login
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	// Find user
	user, err := h.userRepo.FindByEmail(req.Email)
	if err != nil {
		utils.SendError(c, http.StatusUnauthorized, "invalid_credentials", "Invalid email or password")
		return
	}

	// Check password
	if !crypto.CheckPassword(req.Password, user.PasswordHash) {
		utils.SendError(c, http.StatusUnauthorized, "invalid_credentials", "Invalid email or password")
		return
	}

	// Generate tokens
	token, err := h.jwtService.GenerateToken(user)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "token_error", "Failed to generate token")
		return
	}

	refreshToken, expiresAt, err := h.jwtService.GenerateRefreshToken()
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "token_error", "Failed to generate refresh token")
		return
	}

	// Save refresh token
	rt := &models.RefreshToken{
		UserID:    user.ID,
		TokenHash: refreshToken,
		ExpiresAt: expiresAt,
	}
	if err := h.refreshTokenRepo.Create(rt); err != nil {
		utils.SendError(c, http.StatusInternalServerError, "token_error", "Failed to save refresh token")
		return
	}

	c.JSON(http.StatusOK, AuthResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         user,
	})
}

// Refresh handles token refresh
func (h *AuthHandler) Refresh(c *gin.Context) {
	var req RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	// Validate refresh token
	rt, err := h.refreshTokenRepo.FindByToken(req.RefreshToken)
	if err != nil {
		utils.SendError(c, http.StatusUnauthorized, "invalid_token", "Invalid or expired refresh token")
		return
	}

	// Get user
	user, err := h.userRepo.FindByID(rt.UserID)
	if err != nil {
		utils.SendError(c, http.StatusUnauthorized, "user_not_found", "User not found")
		return
	}

	// Delete old refresh token
	h.refreshTokenRepo.DeleteByToken(req.RefreshToken)

	// Generate new tokens
	token, err := h.jwtService.GenerateToken(user)
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "token_error", "Failed to generate token")
		return
	}

	newRefreshToken, expiresAt, err := h.jwtService.GenerateRefreshToken()
	if err != nil {
		utils.SendError(c, http.StatusInternalServerError, "token_error", "Failed to generate refresh token")
		return
	}

	// Save new refresh token
	newRt := &models.RefreshToken{
		UserID:    user.ID,
		TokenHash: newRefreshToken,
		ExpiresAt: expiresAt,
	}
	if err := h.refreshTokenRepo.Create(newRt); err != nil {
		utils.SendError(c, http.StatusInternalServerError, "token_error", "Failed to save refresh token")
		return
	}

	c.JSON(http.StatusOK, AuthResponse{
		Token:        token,
		RefreshToken: newRefreshToken,
		User:         user,
	})
}

// Logout handles user logout
func (h *AuthHandler) Logout(c *gin.Context) {
	var req RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// Even if no refresh token provided, consider logout successful
		utils.SendSuccess(c, "Logged out successfully")
		return
	}

	// Delete refresh token
	h.refreshTokenRepo.DeleteByToken(req.RefreshToken)

	utils.SendSuccess(c, "Logged out successfully")
}

// GetCurrentUser returns the current authenticated user
func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	userID := middleware.GetUserID(c)

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		utils.SendError(c, http.StatusNotFound, "user_not_found", "User not found")
		return
	}

	c.JSON(http.StatusOK, user)
}
