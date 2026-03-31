package services

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/chat-note/backend/internal/config"
	"github.com/chat-note/backend/internal/models"
	"github.com/chat-note/backend/internal/repository"
	"github.com/chat-note/backend/internal/utils"
)

type OAuthUserInfo struct {
	Provider       string
	ProviderUserID string
	Email          string
	Name           string
	AvatarURL      string
}

type OAuthService struct {
	config      *config.OAuthConfig
	userRepo    *repository.UserRepository
	hmacSecret  []byte
	stateExpiry time.Duration
	httpClient  *http.Client
}

func NewOAuthService(cfg *config.OAuthConfig, jwtSecret string) *OAuthService {
	return &OAuthService{
		config:      cfg,
		userRepo:    repository.NewUserRepository(),
		hmacSecret:  []byte(jwtSecret),
		stateExpiry: 10 * time.Minute,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// GenerateState creates a self-contained HMAC-signed state token.
// Format: nonce.timestamp.signature
// No server-side storage needed — works across multiple instances and restarts.
func (s *OAuthService) GenerateState(parts ...uint) string {
	nonceBytes := make([]byte, 16)
	if _, err := rand.Read(nonceBytes); err != nil {
		utils.LogOperationError("OAuthService", "GenerateState", err)
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	nonce := hex.EncodeToString(nonceBytes)
	timestamp := time.Now().Unix()

	sig := s.computeHMAC(nonce, timestamp, parts...)
	state := fmt.Sprintf("%s.%d.%s", nonce, timestamp, sig)

	// Prepend userID if provided (for BindAccount flow)
	if len(parts) > 0 {
		state = fmt.Sprintf("%d:%s", parts[0], state)
	}

	utils.LogInfo("OAuthService", "GenerateState", "state", state)
	return state
}

// ValidateState verifies the HMAC signature and checks expiry.
// Supports both plain state (nonce.timestamp.sig) and bind state (userID:nonce.timestamp.sig).
func (s *OAuthService) ValidateState(state string) bool {
	// Strip optional userID prefix for BindAccount flow
	hmacPart := state
	var userID uint
	hasUserID := false
	if idx := strings.Index(state, ":"); idx != -1 {
		hmacPart = state[idx+1:]
		if id, err := strconv.ParseUint(state[:idx], 10, 64); err == nil {
			userID = uint(id)
			hasUserID = true
		}
	}

	parts := strings.Split(hmacPart, ".")
	if len(parts) != 3 {
		utils.LogWarn("OAuthService", "ValidateState", "state", state, "reason", "invalid_format")
		return false
	}

	nonce := parts[0]
	timestamp, err := strconv.ParseInt(parts[1], 10, 64)
	if err != nil {
		utils.LogWarn("OAuthService", "ValidateState", "state", state, "reason", "invalid_timestamp")
		return false
	}
	sig := parts[2]

	// Check expiry
	if time.Since(time.Unix(timestamp, 0)) > s.stateExpiry {
		utils.LogWarn("OAuthService", "ValidateState", "state", state, "reason", "state_expired")
		return false
	}

	// Verify HMAC (with or without userID)
	var expectedSig string
	if hasUserID {
		expectedSig = s.computeHMAC(nonce, timestamp, userID)
	} else {
		expectedSig = s.computeHMAC(nonce, timestamp)
	}
	if !hmac.Equal([]byte(sig), []byte(expectedSig)) {
		utils.LogWarn("OAuthService", "ValidateState", "state", state, "reason", "invalid_signature")
		return false
	}

	utils.LogInfo("OAuthService", "ValidateState", "state", state, "valid", true)
	return true
}

func (s *OAuthService) computeHMAC(nonce string, timestamp int64, userParts ...uint) string {
	mac := hmac.New(sha256.New, s.hmacSecret)
	payload := fmt.Sprintf("%s.%d", nonce, timestamp)
	if len(userParts) > 0 {
		payload = fmt.Sprintf("%s.%d.%d", nonce, timestamp, userParts[0])
	}
	mac.Write([]byte(payload))
	return hex.EncodeToString(mac.Sum(nil))
}

func (s *OAuthService) GenerateAuthURL(provider, state string) (string, error) {
	providerConfig, err := s.config.GetProviderConfig(provider)
	if err != nil {
		return "", err
	}

	if !s.config.IsProviderEnabled(provider) {
		return "", fmt.Errorf("OAuth provider %s is not enabled", provider)
	}

	switch provider {
	case models.OAuthProviderGoogle:
		return s.generateGoogleAuthURL(providerConfig, state), nil
	case models.OAuthProviderGitHub:
		return s.generateGitHubAuthURL(providerConfig, state), nil
	default:
		return "", fmt.Errorf("unsupported OAuth provider: %s", provider)
	}
}

func (s *OAuthService) generateGoogleAuthURL(cfg *config.OAuthProviderConfig, state string) string {
	params := url.Values{}
	params.Set("client_id", cfg.ClientID)
	params.Set("redirect_uri", cfg.RedirectURI)
	params.Set("response_type", "code")
	params.Set("scope", "openid email profile")
	params.Set("state", state)
	params.Set("access_type", "online")

	authURL := fmt.Sprintf("https://accounts.google.com/o/oauth2/v2/auth?%s", params.Encode())
	utils.LogInfo("OAuthService", "generateGoogleAuthURL", "redirect_uri", cfg.RedirectURI)
	return authURL
}

func (s *OAuthService) generateGitHubAuthURL(cfg *config.OAuthProviderConfig, state string) string {
	params := url.Values{}
	params.Set("client_id", cfg.ClientID)
	params.Set("redirect_uri", cfg.RedirectURI)
	params.Set("scope", "user:email")
	params.Set("state", state)

	authURL := fmt.Sprintf("https://github.com/login/oauth/authorize?%s", params.Encode())
	utils.LogInfo("OAuthService", "generateGitHubAuthURL", "redirect_uri", cfg.RedirectURI)
	return authURL
}

func (s *OAuthService) HandleCallback(provider, code string) (*OAuthUserInfo, error) {
	providerConfig, err := s.config.GetProviderConfig(provider)
	if err != nil {
		return nil, err
	}

	if !s.config.IsProviderEnabled(provider) {
		return nil, fmt.Errorf("OAuth provider %s is not enabled", provider)
	}

	switch provider {
	case models.OAuthProviderGoogle:
		return s.handleGoogleCallback(providerConfig, code)
	case models.OAuthProviderGitHub:
		return s.handleGitHubCallback(providerConfig, code)
	default:
		return nil, fmt.Errorf("unsupported OAuth provider: %s", provider)
	}
}

func (s *OAuthService) handleGoogleCallback(cfg *config.OAuthProviderConfig, code string) (*OAuthUserInfo, error) {
	token, err := s.exchangeGoogleToken(cfg, code)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange Google token: %w", err)
	}

	userInfo, err := s.getGoogleUserInfo(token)
	if err != nil {
		return nil, fmt.Errorf("failed to get Google user info: %w", err)
	}

	utils.LogOperationSuccess("OAuthService", "handleGoogleCallback", "email", utils.MaskEmail(userInfo.Email))
	return userInfo, nil
}

func (s *OAuthService) exchangeGoogleToken(cfg *config.OAuthProviderConfig, code string) (string, error) {
	tokenURL := "https://oauth2.googleapis.com/token"

	data := url.Values{}
	data.Set("code", code)
	data.Set("client_id", cfg.ClientID)
	data.Set("client_secret", cfg.ClientSecret)
	data.Set("redirect_uri", cfg.RedirectURI)
	data.Set("grant_type", "authorization_code")

	req, err := http.NewRequest("POST", tokenURL, strings.NewReader(data.Encode()))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		utils.LogExternalCallError("OAuthService", "google", err, "step", "exchange_token")
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != http.StatusOK {
		utils.LogExternalCallError("OAuthService", "google", fmt.Errorf("token exchange failed: %s", string(body)), "status", resp.StatusCode)
		return "", fmt.Errorf("token exchange failed: %s", string(body))
	}

	var tokenResp struct {
		AccessToken string `json:"access_token"`
		TokenType   string `json:"token_type"`
	}

	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return "", err
	}

	return tokenResp.AccessToken, nil
}

func (s *OAuthService) getGoogleUserInfo(accessToken string) (*OAuthUserInfo, error) {
	userInfoURL := "https://www.googleapis.com/oauth2/v2/userinfo"

	req, err := http.NewRequest("GET", userInfoURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))

	resp, err := s.httpClient.Do(req)
	if err != nil {
		utils.LogExternalCallError("OAuthService", "google", err, "step", "get_user_info")
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to get user info: %s", string(body))
	}

	var googleUser struct {
		ID      string `json:"id"`
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}

	if err := json.Unmarshal(body, &googleUser); err != nil {
		return nil, err
	}

	return &OAuthUserInfo{
		Provider:       models.OAuthProviderGoogle,
		ProviderUserID: googleUser.ID,
		Email:          googleUser.Email,
		Name:           googleUser.Name,
		AvatarURL:      googleUser.Picture,
	}, nil
}

func (s *OAuthService) handleGitHubCallback(cfg *config.OAuthProviderConfig, code string) (*OAuthUserInfo, error) {
	token, err := s.exchangeGitHubToken(cfg, code)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange GitHub token: %w", err)
	}

	userInfo, err := s.getGitHubUserInfo(token)
	if err != nil {
		return nil, fmt.Errorf("failed to get GitHub user info: %w", err)
	}

	if userInfo.Email == "" {
		email, err := s.getGitHubUserEmail(token)
		if err != nil {
			utils.LogWarn("OAuthService", "handleGitHubCallback", "reason", "failed_to_get_email", "error", err.Error())
		} else {
			userInfo.Email = email
		}
	}

	utils.LogOperationSuccess("OAuthService", "handleGitHubCallback", "email", utils.MaskEmail(userInfo.Email))
	return userInfo, nil
}

func (s *OAuthService) exchangeGitHubToken(cfg *config.OAuthProviderConfig, code string) (string, error) {
	tokenURL := "https://github.com/login/oauth/access_token"

	data := url.Values{}
	data.Set("code", code)
	data.Set("client_id", cfg.ClientID)
	data.Set("client_secret", cfg.ClientSecret)
	data.Set("redirect_uri", cfg.RedirectURI)

	req, err := http.NewRequest("POST", tokenURL, strings.NewReader(data.Encode()))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		utils.LogExternalCallError("OAuthService", "github", err, "step", "exchange_token")
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != http.StatusOK {
		utils.LogExternalCallError("OAuthService", "github", fmt.Errorf("token exchange failed: %s", string(body)), "status", resp.StatusCode)
		return "", fmt.Errorf("token exchange failed: %s", string(body))
	}

	var tokenResp struct {
		AccessToken string `json:"access_token"`
		TokenType   string `json:"token_type"`
		Scope       string `json:"scope"`
		Error       string `json:"error"`
	}

	if err := json.Unmarshal(body, &tokenResp); err != nil {
		return "", err
	}

	if tokenResp.Error != "" {
		return "", fmt.Errorf("GitHub OAuth error: %s", tokenResp.Error)
	}

	return tokenResp.AccessToken, nil
}

func (s *OAuthService) getGitHubUserInfo(accessToken string) (*OAuthUserInfo, error) {
	userInfoURL := "https://api.github.com/user"

	req, err := http.NewRequest("GET", userInfoURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		utils.LogExternalCallError("OAuthService", "github", err, "step", "get_user_info")
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to get user info: %s", string(body))
	}

	var githubUser struct {
		ID        int    `json:"id"`
		Login     string `json:"login"`
		Email     string `json:"email"`
		Name      string `json:"name"`
		AvatarURL string `json:"avatar_url"`
	}

	if err := json.Unmarshal(body, &githubUser); err != nil {
		return nil, err
	}

	name := githubUser.Name
	if name == "" {
		name = githubUser.Login
	}

	return &OAuthUserInfo{
		Provider:       models.OAuthProviderGitHub,
		ProviderUserID: fmt.Sprintf("%d", githubUser.ID),
		Email:          githubUser.Email,
		Name:           name,
		AvatarURL:      githubUser.AvatarURL,
	}, nil
}

func (s *OAuthService) getGitHubUserEmail(accessToken string) (string, error) {
	emailURL := "https://api.github.com/user/emails"

	req, err := http.NewRequest("GET", emailURL, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))
	req.Header.Set("Accept", "application/vnd.github.v3+json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to get user emails: %s", string(body))
	}

	var emails []struct {
		Email   string `json:"email"`
		Primary bool   `json:"primary"`
	}

	if err := json.Unmarshal(body, &emails); err != nil {
		return "", err
	}

	for _, e := range emails {
		if e.Primary {
			return e.Email, nil
		}
	}

	if len(emails) > 0 {
		return emails[0].Email, nil
	}

	return "", fmt.Errorf("no email found")
}
