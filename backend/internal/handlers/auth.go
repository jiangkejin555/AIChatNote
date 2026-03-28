package handlers

import (
	"fmt"
	"net/http"

	"github.com/chat-note/backend/internal/crypto"
	"github.com/chat-note/backend/internal/middleware"
	"github.com/chat-note/backend/internal/models"
	"github.com/chat-note/backend/internal/repository"
	"github.com/chat-note/backend/internal/services"
	"github.com/chat-note/backend/internal/utils"
	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	userRepo              *repository.UserRepository
	refreshTokenRepo      *repository.RefreshTokenRepository
	accountDeletionRepo   *repository.AccountDeletionRepository
	notificationRepo      *repository.NotificationRepository
	jwtService            *crypto.JWTService
	verificationCodeSvc   *services.VerificationCodeService
	emailSvc              *services.EmailService
}

func NewAuthHandler(jwtService *crypto.JWTService, verificationCodeSvc *services.VerificationCodeService, emailSvc *services.EmailService) *AuthHandler {
	return &AuthHandler{
		userRepo:              repository.NewUserRepository(),
		refreshTokenRepo:      repository.NewRefreshTokenRepository(),
		accountDeletionRepo:   repository.NewAccountDeletionRepository(),
		notificationRepo:      repository.NewNotificationRepository(),
		jwtService:            jwtService,
		verificationCodeSvc:   verificationCodeSvc,
		emailSvc:              emailSvc,
	}
}

type RegisterRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Code     string `json:"code" binding:"required,len=6"`
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

	if !services.IsValidEmail(req.Email) {
		utils.SendError(c, http.StatusBadRequest, "invalid_email", "Invalid email format")
		return
	}

	if !h.verificationCodeSvc.VerifyCode(req.Email, req.Code) {
		utils.LogAuthEvent("register", false, "email", req.Email, "reason", "invalid_code")
		utils.SendError(c, http.StatusUnauthorized, "invalid_code", "Invalid or expired verification code")
		return
	}

	if existingUser, _ := h.userRepo.FindByEmail(req.Email); existingUser != nil {
		utils.LogAuthEvent("register", false, "email", req.Email, "reason", "email_exists")
		utils.SendError(c, http.StatusConflict, "email_exists", "Email already registered")
		return
	}

	passwordHash, err := crypto.HashPassword(req.Password)
	if err != nil {
		utils.LogOperationError("AuthHandler", "Register", err, "email", req.Email, "step", "password_hash")
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "hash_error", "Failed to secure password", err)
		return
	}

	user := &models.User{
		Email:        req.Email,
		PasswordHash: passwordHash,
	}
	if err := h.userRepo.Create(user); err != nil {
		utils.LogOperationError("AuthHandler", "Register", err, "email", req.Email, "step", "create_user")
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "create_error", "Failed to create user", err)
		return
	}

	// Send welcome notification
	h.sendWelcomeNotification(user)

	token, err := h.jwtService.GenerateToken(user)
	if err != nil {
		utils.LogOperationError("AuthHandler", "Register", err, "email", req.Email, "step", "generate_token")
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "token_error", "Failed to generate token", err)
		return
	}

	refreshToken, expiresAt, err := h.jwtService.GenerateRefreshToken()
	if err != nil {
		utils.LogOperationError("AuthHandler", "Register", err, "email", req.Email, "step", "generate_refresh_token")
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "token_error", "Failed to generate refresh token", err)
		return
	}

	rt := &models.RefreshToken{
		UserID:    user.ID,
		TokenHash: refreshToken,
		ExpiresAt: expiresAt,
	}
	if err := h.refreshTokenRepo.Create(rt); err != nil {
		utils.LogOperationError("AuthHandler", "Register", err, "email", req.Email, "step", "save_refresh_token")
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "token_error", "Failed to save refresh token", err)
		return
	}

	utils.LogOperationSuccess("AuthHandler", "Register", "userID", user.ID, "email", user.Email)
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
		utils.LogAuthEvent("login", false, "email", req.Email, "reason", "user_not_found")
		utils.SendErrorWithErr(c, http.StatusUnauthorized, "invalid_credentials", "Invalid email or password", err)
		return
	}

	// Check password
	if !crypto.CheckPassword(req.Password, user.PasswordHash) {
		utils.LogAuthEvent("login", false, "email", req.Email, "userID", user.ID, "reason", "invalid_password")
		utils.SendError(c, http.StatusUnauthorized, "invalid_credentials", "Invalid email or password")
		return
	}

	// Generate tokens
	token, err := h.jwtService.GenerateToken(user)
	if err != nil {
		utils.LogOperationError("AuthHandler", "Login", err, "email", req.Email, "step", "generate_token")
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "token_error", "Failed to generate token", err)
		return
	}

	refreshToken, expiresAt, err := h.jwtService.GenerateRefreshToken()
	if err != nil {
		utils.LogOperationError("AuthHandler", "Login", err, "email", req.Email, "step", "generate_refresh_token")
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "token_error", "Failed to generate refresh token", err)
		return
	}

	// Save refresh token
	rt := &models.RefreshToken{
		UserID:    user.ID,
		TokenHash: refreshToken,
		ExpiresAt: expiresAt,
	}
	if err := h.refreshTokenRepo.Create(rt); err != nil {
		utils.LogOperationError("AuthHandler", "Login", err, "email", req.Email, "step", "save_refresh_token")
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "token_error", "Failed to save refresh token", err)
		return
	}

	utils.LogAuthEvent("login", true, "userID", user.ID, "email", user.Email)
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
		utils.LogAuthEvent("token_refresh", false, "reason", "invalid_refresh_token")
		utils.SendErrorWithErr(c, http.StatusUnauthorized, "invalid_token", "Invalid or expired refresh token", err)
		return
	}

	// Get user
	user, err := h.userRepo.FindByID(rt.UserID)
	if err != nil {
		utils.LogAuthEvent("token_refresh", false, "userID", rt.UserID, "reason", "user_not_found")
		utils.SendErrorWithErr(c, http.StatusUnauthorized, "user_not_found", "User not found", err)
		return
	}

	// Delete old refresh token
	h.refreshTokenRepo.DeleteByToken(req.RefreshToken)

	// Generate new tokens
	token, err := h.jwtService.GenerateToken(user)
	if err != nil {
		utils.LogOperationError("AuthHandler", "Refresh", err, "userID", user.ID, "step", "generate_token")
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "token_error", "Failed to generate token", err)
		return
	}

	newRefreshToken, expiresAt, err := h.jwtService.GenerateRefreshToken()
	if err != nil {
		utils.LogOperationError("AuthHandler", "Refresh", err, "userID", user.ID, "step", "generate_refresh_token")
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "token_error", "Failed to generate refresh token", err)
		return
	}

	// Save new refresh token
	newRt := &models.RefreshToken{
		UserID:    user.ID,
		TokenHash: newRefreshToken,
		ExpiresAt: expiresAt,
	}
	if err := h.refreshTokenRepo.Create(newRt); err != nil {
		utils.LogOperationError("AuthHandler", "Refresh", err, "userID", user.ID, "step", "save_refresh_token")
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "token_error", "Failed to save refresh token", err)
		return
	}

	utils.LogAuthEvent("token_refresh", true, "userID", user.ID)
	c.JSON(http.StatusOK, AuthResponse{
		Token:        token,
		RefreshToken: newRefreshToken,
		User:         user,
	})
}

// Logout handles user logout
func (h *AuthHandler) Logout(c *gin.Context) {
	userID := middleware.GetUserID(c)
	var req RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// Even if no refresh token provided, consider logout successful
		utils.LogAuthEvent("logout", true, "userID", userID, "note", "no_refresh_token_provided")
		utils.SendSuccess(c, "Logged out successfully")
		return
	}

	// Delete refresh token
	h.refreshTokenRepo.DeleteByToken(req.RefreshToken)

	utils.LogAuthEvent("logout", true, "userID", userID)
	utils.SendSuccess(c, "Logged out successfully")
}

// GetCurrentUser returns the current authenticated user
func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	userID := middleware.GetUserID(c)

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		utils.LogOperationError("AuthHandler", "GetCurrentUser", err, "userID", userID)
		utils.SendErrorWithErr(c, http.StatusNotFound, "user_not_found", "User not found", err)
		return
	}

	utils.LogOperationSuccess("AuthHandler", "GetCurrentUser", "userID", user.ID, "email", user.Email)
	c.JSON(http.StatusOK, user)
}

type SendVerificationCodeRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type SendVerificationCodeResponse struct {
	Message    string `json:"message"`
	RetryAfter int    `json:"retry_after,omitempty"`
}

type VerifyCodeAndLoginRequest struct {
	Email string `json:"email" binding:"required,email"`
	Code  string `json:"code" binding:"required,len=6"`
}

type DeleteAccountRequest struct {
	Code string `json:"code" binding:"required,len=6"`
}

type DeleteAccountResponse struct {
	Message string `json:"message"`
}

type ChangePasswordRequest struct {
	Email       string `json:"email" binding:"required,email"`
	Code        string `json:"code" binding:"required,len=6"`
	NewPassword string `json:"new_password" binding:"required,min=8"`
}

func (h *AuthHandler) SendVerificationCode(c *gin.Context) {
	var req SendVerificationCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	if !services.IsValidEmail(req.Email) {
		utils.SendError(c, http.StatusBadRequest, "invalid_email", "Invalid email format")
		return
	}

	if !h.emailSvc.IsEnabled() {
		utils.SendError(c, http.StatusServiceUnavailable, "service_unavailable", "Email service is not configured")
		return
	}

	if h.verificationCodeSvc.IsRateLimited(req.Email) {
		remaining := h.verificationCodeSvc.GetRateLimitRemaining(req.Email)
		utils.LogAuthEvent("send_verification_code", false, "email", req.Email, "reason", "rate_limited")
		utils.SendError(c, http.StatusTooManyRequests, "rate_limited", fmt.Sprintf("Please wait %d seconds before requesting a new code", int(remaining.Seconds())))
		return
	}

	code, err := h.verificationCodeSvc.GenerateCode(req.Email)
	if err != nil {
		utils.LogOperationError("AuthHandler", "SendVerificationCode", err, "email", req.Email, "step", "generate_code")
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "code_generation_error", "Failed to generate verification code", err)
		return
	}

	if err := h.emailSvc.SendVerificationCode(req.Email, code); err != nil {
		utils.LogOperationError("AuthHandler", "SendVerificationCode", err, "email", req.Email, "step", "send_email")
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "email_send_error", "Failed to send verification code", err)
		return
	}

	utils.LogAuthEvent("send_verification_code", true, "email", utils.MaskEmail(req.Email))
	c.JSON(http.StatusOK, SendVerificationCodeResponse{
		Message: "Verification code sent successfully",
	})
}

func (h *AuthHandler) VerifyCodeAndLogin(c *gin.Context) {
	var req VerifyCodeAndLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	if !services.IsValidEmail(req.Email) {
		utils.SendError(c, http.StatusBadRequest, "invalid_email", "Invalid email format")
		return
	}

	if !h.verificationCodeSvc.VerifyCode(req.Email, req.Code) {
		utils.LogAuthEvent("verify_code_login", false, "email", req.Email, "reason", "invalid_code")
		utils.SendError(c, http.StatusUnauthorized, "invalid_code", "Invalid or expired verification code")
		return
	}

	user, err := h.userRepo.FindByEmail(req.Email)
	if err != nil {
		user = &models.User{
			Email:        req.Email,
			PasswordHash: "",
		}
		if err := h.userRepo.Create(user); err != nil {
			utils.LogOperationError("AuthHandler", "VerifyCodeAndLogin", err, "email", req.Email, "step", "create_user")
			utils.SendErrorWithErr(c, http.StatusInternalServerError, "create_error", "Failed to create user", err)
			return
		}
		utils.LogOperationSuccess("AuthHandler", "VerifyCodeAndLogin", "action", "user_created", "userID", user.ID, "email", user.Email)
		// Send welcome notification for new users
		h.sendWelcomeNotification(user)
	}

	token, err := h.jwtService.GenerateToken(user)
	if err != nil {
		utils.LogOperationError("AuthHandler", "VerifyCodeAndLogin", err, "email", req.Email, "step", "generate_token")
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "token_error", "Failed to generate token", err)
		return
	}

	refreshToken, expiresAt, err := h.jwtService.GenerateRefreshToken()
	if err != nil {
		utils.LogOperationError("AuthHandler", "VerifyCodeAndLogin", err, "email", req.Email, "step", "generate_refresh_token")
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "token_error", "Failed to generate refresh token", err)
		return
	}

	rt := &models.RefreshToken{
		UserID:    user.ID,
		TokenHash: refreshToken,
		ExpiresAt: expiresAt,
	}
	if err := h.refreshTokenRepo.Create(rt); err != nil {
		utils.LogOperationError("AuthHandler", "VerifyCodeAndLogin", err, "email", req.Email, "step", "save_refresh_token")
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "token_error", "Failed to save refresh token", err)
		return
	}

	utils.LogAuthEvent("verify_code_login", true, "userID", user.ID, "email", user.Email)
	c.JSON(http.StatusOK, AuthResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         user,
	})
}

func (h *AuthHandler) DeleteAccount(c *gin.Context) {
	var req DeleteAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	userID := middleware.GetUserID(c)
	currentEmail := middleware.GetEmail(c)

	if !h.verificationCodeSvc.VerifyCode(currentEmail, req.Code) {
		utils.LogAuthEvent("delete_account", false, "userID", userID, "reason", "invalid_code")
		utils.SendError(c, http.StatusUnauthorized, "invalid_code", "Invalid or expired verification code")
		return
	}

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		utils.LogOperationError("AuthHandler", "DeleteAccount", err, "userID", userID, "step", "find_user")
		utils.SendErrorWithErr(c, http.StatusNotFound, "user_not_found", "User not found", err)
		return
	}

	if err := h.accountDeletionRepo.DeleteAllUserData(userID); err != nil {
		utils.LogOperationError("AuthHandler", "DeleteAccount", err, "userID", userID, "step", "delete_user_data")
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "delete_error", "Failed to delete account", err)
		return
	}

	utils.LogAuthEvent("delete_account", true, "userID", userID, "email", user.Email)
	c.JSON(http.StatusOK, DeleteAccountResponse{
		Message: "Account deleted successfully",
	})
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	userID := middleware.GetUserID(c)
	currentEmail := middleware.GetEmail(c)

	if req.Email != currentEmail {
		utils.LogAuthEvent("change_password", false, "userID", userID, "reason", "email_mismatch")
		utils.SendError(c, http.StatusForbidden, "email_mismatch", "Email does not match current user")
		return
	}

	if !h.verificationCodeSvc.VerifyCode(req.Email, req.Code) {
		utils.LogAuthEvent("change_password", false, "email", req.Email, "userID", userID, "reason", "invalid_code")
		utils.SendError(c, http.StatusUnauthorized, "invalid_code", "Invalid or expired verification code")
		return
	}

	passwordHash, err := crypto.HashPassword(req.NewPassword)
	if err != nil {
		utils.LogOperationError("AuthHandler", "ChangePassword", err, "email", req.Email, "userID", userID, "step", "password_hash")
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "hash_error", "Failed to secure password", err)
		return
	}

	if err := h.userRepo.UpdatePassword(userID, passwordHash); err != nil {
		utils.LogOperationError("AuthHandler", "ChangePassword", err, "email", req.Email, "userID", userID, "step", "update_password")
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "update_error", "Failed to update password", err)
		return
	}

	utils.LogAuthEvent("change_password", true, "userID", userID, "email", req.Email)
	c.JSON(http.StatusOK, gin.H{
		"message": "Password updated successfully",
	})
}

// sendWelcomeNotification sends a welcome notification to a newly registered user
func (h *AuthHandler) sendWelcomeNotification(user *models.User) {
	// Get user count for "第X位用户"
	userCount, err := h.userRepo.Count()
	if err != nil {
		utils.LogOperationError("AuthHandler", "sendWelcomeNotification", err, "userID", user.ID, "step", "get_user_count")
		userCount = 1 // fallback
	}

	// Extract username from email (part before @)
	username := user.Email
	if idx := len(user.Email); idx > 0 {
		for i, c := range user.Email {
			if c == '@' {
				username = user.Email[:i]
				break
			}
		}
	}

	vars := map[string]string{
		"username":   username,
		"user_count": fmt.Sprintf("%d", userCount),
	}

	_, err = h.notificationRepo.CreateFromTemplate(user.ID, "welcome", vars, models.NotificationPayload{})
	if err != nil {
		utils.LogOperationError("AuthHandler", "sendWelcomeNotification", err, "userID", user.ID, "step", "create_notification")
	}
}
