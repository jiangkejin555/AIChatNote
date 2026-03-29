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
	SyncNote(noteTitle string, noteContent string, userID uint, existingPageID *string) (string, error)
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

func (s *notionService) SyncNote(noteTitle string, noteContent string, userID uint, existingPageID *string) (string, error) {
	// 1. Fetch integration token via IntegrationRepository
	integration, err := s.repo.GetByUserIDAndProvider(userID, "notion")
	if err != nil {
		return "", fmt.Errorf("failed to fetch integration: %w", err)
	}

	// 2. Decrypt access token
	accessToken, err := s.crypto.Decrypt(integration.AccessTokenEncrypted)
	if err != nil {
		return "", fmt.Errorf("failed to decrypt access token: %w", err)
	}

	// 3. Archive existing page if any
	if existingPageID != nil && *existingPageID != "" {
		_ = s.archivePage(*existingPageID, accessToken)
	}

	// 4. Parse Note Content to Blocks
	blocks := ParseMarkdownToNotionBlocks([]byte(noteContent))

	// 5. Create new page under notion_app_page_id
	if integration.NotionAppPageID == nil || *integration.NotionAppPageID == "" {
		return "", fmt.Errorf("notion app page ID is missing")
	}

	var firstBatch []map[string]interface{}
	if len(blocks) > 100 {
		firstBatch = blocks[:100]
	} else {
		firstBatch = blocks
	}

	newPageID, err := s.createPage(*integration.NotionAppPageID, noteTitle, firstBatch, accessToken)
	if err != nil {
		return "", fmt.Errorf("failed to create notion page: %w", err)
	}

	if len(blocks) > 100 {
		remaining := blocks[100:]
		for len(remaining) > 0 {
			chunkSize := 100
			if len(remaining) < chunkSize {
				chunkSize = len(remaining)
			}
			chunk := remaining[:chunkSize]
			
			err = s.appendBlocks(newPageID, chunk, accessToken)
			if err != nil {
				return "", fmt.Errorf("failed to append notion blocks: %w", err)
			}
			remaining = remaining[chunkSize:]
		}
	}

	return newPageID, nil
}

func (s *notionService) archivePage(pageID string, token string) error {
	reqBody := map[string]interface{}{
		"archived": true,
	}
	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("PATCH", fmt.Sprintf("https://api.notion.com/v1/pages/%s", pageID), bytes.NewBuffer(bodyBytes))
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Notion-Version", "2022-06-28")
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// Ignore errors (e.g. 404 if already deleted)
	return nil
}

func (s *notionService) createPage(parentPageID string, title string, blocks []map[string]interface{}, token string) (string, error) {
	reqBody := map[string]interface{}{
		"parent": map[string]interface{}{
			"page_id": parentPageID,
		},
		"properties": map[string]interface{}{
			"title": map[string]interface{}{
				"title": []map[string]interface{}{
					{
						"text": map[string]interface{}{
							"content": title,
						},
					},
				},
			},
		},
		"children": blocks,
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
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
		return "", fmt.Errorf("status %d: %s", resp.StatusCode, string(respBody))
	}

	var pageResp struct {
		ID string `json:"id"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&pageResp); err != nil {
		return "", err
	}

	return pageResp.ID, nil
}

func (s *notionService) appendBlocks(pageID string, blocks []map[string]interface{}, token string) error {
	reqBody := map[string]interface{}{
		"children": blocks,
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("PATCH", fmt.Sprintf("https://api.notion.com/v1/blocks/%s/children", pageID), bytes.NewBuffer(bodyBytes))
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Notion-Version", "2022-06-28")
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("status %d: %s", resp.StatusCode, string(respBody))
	}

	return nil
}
