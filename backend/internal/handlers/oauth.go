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

type OAuthHandler struct {
	oauthService     *services.OAuthService
	userRepo         *repository.UserRepository
	oauthAccountRepo *repository.OAuthAccountRepository
	jwtService       *crypto.JWTService
	refreshTokenRepo *repository.RefreshTokenRepository
}

func NewOAuthHandler(oauthService *services.OAuthService, jwtService *crypto.JWTService) *OAuthHandler {
	return &OAuthHandler{
		oauthService:     oauthService,
		userRepo:         repository.NewUserRepository(),
		oauthAccountRepo: repository.NewOAuthAccountRepository(),
		jwtService:       jwtService,
		refreshTokenRepo: repository.NewRefreshTokenRepository(),
	}
}

type OAuthCallbackRequest struct {
	Code  string `json:"code" binding:"required"`
	State string `json:"state" binding:"required"`
}

type AuthURLResponse struct {
	AuthURL string `json:"auth_url"`
}

func (h *OAuthHandler) GetAuthURL(c *gin.Context) {
	provider := c.Param("provider")

	if !models.IsValidOAuthProvider(provider) {
		utils.SendError(c, http.StatusBadRequest, "invalid_provider", fmt.Sprintf("Unsupported OAuth provider: %s", provider))
		return
	}

	state := h.oauthService.GenerateState()

	authURL, err := h.oauthService.GenerateAuthURL(provider, state)
	if err != nil {
		utils.LogOperationError("OAuthHandler", "GetAuthURL", err, "provider", provider)
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "auth_url_error", "Failed to generate authorization URL", err)
		return
	}

	utils.LogOperationSuccess("OAuthHandler", "GetAuthURL", "provider", provider, "state", state)
	c.JSON(http.StatusOK, AuthURLResponse{
		AuthURL: authURL,
	})
}

func (h *OAuthHandler) HandleCallback(c *gin.Context) {
	provider := c.Param("provider")

	if !models.IsValidOAuthProvider(provider) {
		utils.SendError(c, http.StatusBadRequest, "invalid_provider", fmt.Sprintf("Unsupported OAuth provider: %s", provider))
		return
	}

	var req OAuthCallbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	if !h.oauthService.ValidateState(req.State) {
		utils.LogAuthEvent("oauth_callback", false, "provider", provider, "reason", "invalid_state")
		utils.SendError(c, http.StatusBadRequest, "invalid_state", "Invalid or expired state parameter")
		return
	}

	userInfo, err := h.oauthService.HandleCallback(provider, req.Code)
	if err != nil {
		utils.LogOperationError("OAuthHandler", "HandleCallback", err, "provider", provider, "step", "get_user_info")
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "oauth_error", "Failed to authenticate with OAuth provider", err)
		return
	}

	oauthAccount, err := h.oauthAccountRepo.FindByProviderAndUserID(provider, userInfo.ProviderUserID)
	if err == nil {
		user, err := h.userRepo.FindByID(oauthAccount.UserID)
		if err != nil {
			utils.LogOperationError("OAuthHandler", "HandleCallback", err, "provider", provider, "step", "find_user")
			utils.SendErrorWithErr(c, http.StatusInternalServerError, "user_not_found", "User not found", err)
			return
		}

		authResponse, err := h.generateAuthResponse(user)
		if err != nil {
			utils.LogOperationError("OAuthHandler", "HandleCallback", err, "provider", provider, "step", "generate_token")
			utils.SendErrorWithErr(c, http.StatusInternalServerError, "token_error", "Failed to generate authentication tokens", err)
			return
		}

		utils.LogAuthEvent("oauth_login", true, "provider", provider, "userID", user.ID, "email", utils.MaskEmail(user.Email))
		c.JSON(http.StatusOK, authResponse)
		return
	}

	user, err := h.userRepo.FindByEmail(userInfo.Email)
	if err == nil {
		newOAuthAccount := &models.OAuthAccount{
			UserID:         user.ID,
			Provider:       provider,
			ProviderUserID: userInfo.ProviderUserID,
		}
		if err := h.oauthAccountRepo.Create(newOAuthAccount); err != nil {
			utils.LogOperationError("OAuthHandler", "HandleCallback", err, "provider", provider, "step", "create_oauth_account")
			utils.SendErrorWithErr(c, http.StatusInternalServerError, "oauth_account_error", "Failed to create OAuth account", err)
			return
		}

		authResponse, err := h.generateAuthResponse(user)
		if err != nil {
			utils.LogOperationError("OAuthHandler", "HandleCallback", err, "provider", provider, "step", "generate_token")
			utils.SendErrorWithErr(c, http.StatusInternalServerError, "token_error", "Failed to generate authentication tokens", err)
			return
		}

		utils.LogAuthEvent("oauth_link_and_login", true, "provider", provider, "userID", user.ID, "email", utils.MaskEmail(user.Email))
		c.JSON(http.StatusOK, authResponse)
		return
	}

	newUser := &models.User{
		Email:         userInfo.Email,
		EmailVerified: true,
	}
	if userInfo.Name != "" {
		newUser.Nickname = &userInfo.Name
	}
	if userInfo.AvatarURL != "" {
		newUser.AvatarURL = &userInfo.AvatarURL
	}

	if err := h.userRepo.Create(newUser); err != nil {
		utils.LogOperationError("OAuthHandler", "HandleCallback", err, "provider", provider, "step", "create_user")
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "create_error", "Failed to create user", err)
		return
	}

	// 虽然 model 里定义了 AccessToken、RefreshToken、TokenExpiresAt 字段（oauth_account.go:12-14），但 handler 在创建记录时没有把 token 写进去。原因是当前 OAuth 的设计是 "一次性换 token 换用户信息" 的模式——拿到 access token 后立刻用来获取用户信息（oauth.go:203-214），之后就不需要这个 token 了。这个项目不需要在后台持续调用 Google/GitHub API，所以没存 token。
	newOAuthAccount := &models.OAuthAccount{
		UserID:         newUser.ID,
		Provider:       provider,
		ProviderUserID: userInfo.ProviderUserID,
	}
	if err := h.oauthAccountRepo.Create(newOAuthAccount); err != nil {
		utils.LogOperationError("OAuthHandler", "HandleCallback", err, "provider", provider, "step", "create_oauth_account")
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "oauth_account_error", "Failed to create OAuth account", err)
		return
	}

	authResponse, err := h.generateAuthResponse(newUser)
	if err != nil {
		utils.LogOperationError("OAuthHandler", "HandleCallback", err, "provider", provider, "step", "generate_token")
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "token_error", "Failed to generate authentication tokens", err)
		return
	}

	utils.LogAuthEvent("oauth_register", true, "provider", provider, "userID", newUser.ID, "email", utils.MaskEmail(newUser.Email))
	c.JSON(http.StatusCreated, authResponse)
}

func (h *OAuthHandler) GetLinkedAccounts(c *gin.Context) {
	userID := middleware.GetUserID(c)

	accounts, err := h.oauthAccountRepo.FindByUserID(userID)
	if err != nil {
		utils.LogOperationError("OAuthHandler", "GetLinkedAccounts", err, "userID", userID)
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "fetch_error", "Failed to fetch linked accounts", err)
		return
	}

	utils.LogOperationSuccess("OAuthHandler", "GetLinkedAccounts", "userID", userID, "count", len(accounts))
	c.JSON(http.StatusOK, accounts)
}

func (h *OAuthHandler) UnlinkAccount(c *gin.Context) {
	userID := middleware.GetUserID(c)
	provider := c.Param("provider")

	if !models.IsValidOAuthProvider(provider) {
		utils.SendError(c, http.StatusBadRequest, "invalid_provider", fmt.Sprintf("Unsupported OAuth provider: %s", provider))
		return
	}

	account, err := h.oauthAccountRepo.FindByProviderAndLocalUserID(provider, userID)
	if err != nil {
		utils.SendError(c, http.StatusNotFound, "account_not_found", "OAuth account not found")
		return
	}

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "user_not_found", "User not found", err)
		return
	}

	oauthAccounts, err := h.oauthAccountRepo.FindByUserID(userID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "fetch_error", "Failed to fetch OAuth accounts", err)
		return
	}

	hasPassword := user.PasswordHash != ""
	hasOtherOAuth := len(oauthAccounts) > 1

	if !hasPassword && !hasOtherOAuth {
		utils.LogAuthEvent("oauth_unlink", false, "userID", userID, "provider", provider, "reason", "last_login_method")
		utils.SendError(c, http.StatusBadRequest, "last_login_method", "Cannot unlink the last login method. Please set a password first.")
		return
	}

	if err := h.oauthAccountRepo.Delete(account.ID); err != nil {
		utils.LogOperationError("OAuthHandler", "UnlinkAccount", err, "userID", userID, "provider", provider)
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "unlink_error", "Failed to unlink account", err)
		return
	}

	utils.LogAuthEvent("oauth_unlink", true, "userID", userID, "provider", provider)
	utils.SendSuccess(c, "OAuth account unlinked successfully")
}

func (h *OAuthHandler) BindAccount(c *gin.Context) {
	userID := middleware.GetUserID(c)
	provider := c.Param("provider")

	if !models.IsValidOAuthProvider(provider) {
		utils.SendError(c, http.StatusBadRequest, "invalid_provider", fmt.Sprintf("Unsupported OAuth provider: %s", provider))
		return
	}

	_, err := h.oauthAccountRepo.FindByProviderAndLocalUserID(provider, userID)
	if err == nil {
		utils.SendError(c, http.StatusConflict, "already_linked", "This OAuth provider is already linked to your account")
		return
	}

	state := h.oauthService.GenerateState(userID)

	authURL, err := h.oauthService.GenerateAuthURL(provider, state)
	if err != nil {
		utils.LogOperationError("OAuthHandler", "BindAccount", err, "provider", provider, "userID", userID)
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "auth_url_error", "Failed to generate authorization URL", err)
		return
	}

	utils.LogOperationSuccess("OAuthHandler", "BindAccount", "provider", provider, "userID", userID)
	c.JSON(http.StatusOK, AuthURLResponse{
		AuthURL: authURL,
	})
}

func (h *OAuthHandler) generateAuthResponse(user *models.User) (*AuthResponse, error) {
	token, err := h.jwtService.GenerateToken(user)
	if err != nil {
		return nil, err
	}

	refreshToken, expiresAt, err := h.jwtService.GenerateRefreshToken()
	if err != nil {
		return nil, err
	}

	rt := &models.RefreshToken{
		UserID:    user.ID,
		TokenHash: refreshToken,
		ExpiresAt: expiresAt,
	}
	if err := h.refreshTokenRepo.Create(rt); err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         user,
	}, nil
}
