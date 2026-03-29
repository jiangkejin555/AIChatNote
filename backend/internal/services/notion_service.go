package services

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/chat-note/backend/internal/config"
	"github.com/chat-note/backend/internal/crypto"
	"github.com/chat-note/backend/internal/models"
	"github.com/chat-note/backend/internal/repository"
)

type NotionService interface {
	GetAuthURL() string
	HandleCallback(code string, userID uint) error
}

type HTTPClient interface {
	Do(req *http.Request) (*http.Response, error)
}

type notionService struct {
	config     *config.NotionConfig
	repo       repository.IntegrationRepository
	crypto     *crypto.AESCrypto
	httpClient HTTPClient
}

func NewNotionService(cfg *config.NotionConfig, encryptionKey string, repo repository.IntegrationRepository, client HTTPClient) (NotionService, error) {
	aesCrypto, err := crypto.NewAESCrypto(encryptionKey)
	if err != nil {
		return nil, err
	}
	
	if client == nil {
		client = &http.Client{
			Timeout: 10 * time.Second,
		}
	}

	return &notionService{
		config:     cfg,
		repo:       repo,
		crypto:     aesCrypto,
		httpClient: client,
	}, nil
}

func (s *notionService) GetAuthURL() string {
	params := url.Values{}
	params.Set("client_id", s.config.ClientID)
	params.Set("response_type", "code")
	params.Set("owner", "user")
	params.Set("redirect_uri", s.config.RedirectURI)

	return fmt.Sprintf("https://api.notion.com/v1/oauth/authorize?%s", params.Encode())
}

func (s *notionService) HandleCallback(code string, userID uint) error {
	// 1. Exchange code for token
	tokenResp, err := s.exchangeToken(code)
	if err != nil {
		return fmt.Errorf("failed to exchange token: %w", err)
	}

	// 2. Encrypt token
	encryptedToken, err := s.crypto.Encrypt(tokenResp.AccessToken)
	if err != nil {
		return fmt.Errorf("failed to encrypt token: %w", err)
	}

	// 3. Auto-create App Page "AIChatNote"
	appPageID, err := s.createAppPage(tokenResp.AccessToken)
	if err != nil {
		return fmt.Errorf("failed to create app page: %w", err)
	}

	// 4. Save Integration Data
	workspaceID := tokenResp.WorkspaceID
	
	integration := &models.Integration{
		UserID:               userID,
		Provider:             "notion",
		AccessTokenEncrypted: encryptedToken,
		NotionWorkspaceID:    &workspaceID,
		NotionAppPageID:      &appPageID,
	}

	return s.repo.CreateOrUpdate(integration)
}

type notionTokenResponse struct {
	AccessToken   string `json:"access_token"`
	WorkspaceID   string `json:"workspace_id"`
	BotID         string `json:"bot_id"`
}

func (s *notionService) exchangeToken(code string) (*notionTokenResponse, error) {
	reqBody := map[string]string{
		"grant_type":   "authorization_code",
		"code":         code,
		"redirect_uri": s.config.RedirectURI,
	}
	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request body: %w", err)
	}

	req, err := http.NewRequest("POST", "https://api.notion.com/v1/oauth/token", bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	
	auth := s.config.ClientID + ":" + s.config.ClientSecret
	basicAuth := base64.StdEncoding.EncodeToString([]byte(auth))
	req.Header.Set("Authorization", "Basic "+basicAuth)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("token exchange failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	var tokenResp notionTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return nil, err
	}

	return &tokenResp, nil
}

func (s *notionService) createAppPage(token string) (string, error) {
	reqBody := map[string]interface{}{
		"parent": map[string]bool{
			"workspace": true,
		},
		"properties": map[string]interface{}{
			"title": map[string]interface{}{
				"title": []map[string]interface{}{
					{
						"text": map[string]interface{}{
							"content": "AIChatNote",
						},
					},
				},
			},
		},
	}
	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request body: %w", err)
	}

	req, err := http.NewRequest("POST", "https://api.notion.com/v1/pages", bytes.NewBuffer(bodyBytes))
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Notion-Version", "2022-06-28")
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("create page failed with status %d: %s", resp.StatusCode, string(respBody))
	}

	var pageResp struct {
		ID string `json:"id"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&pageResp); err != nil {
		return "", err
	}

	return pageResp.ID, nil
}
