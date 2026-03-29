package services

import (
	"bytes"
	"errors"
	"io"
	"net/http"
	"testing"

	"github.com/chat-note/backend/internal/config"
	"github.com/chat-note/backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockRoundTripper is a mock for http.RoundTripper
type MockRoundTripper struct {
	mock.Mock
}

func (m *MockRoundTripper) RoundTrip(req *http.Request) (*http.Response, error) {
	args := m.Called(req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*http.Response), args.Error(1)
}

// MockIntegrationRepository is a mock for repository.IntegrationRepository
type MockIntegrationRepository struct {
	mock.Mock
}

func (m *MockIntegrationRepository) GetByUserIDAndProvider(userID uint, provider string) (*models.Integration, error) {
	args := m.Called(userID, provider)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Integration), args.Error(1)
}

func (m *MockIntegrationRepository) CreateOrUpdate(integration *models.Integration) error {
	args := m.Called(integration)
	return args.Error(0)
}

func (m *MockIntegrationRepository) Delete(userID uint, provider string) error {
	args := m.Called(userID, provider)
	return args.Error(0)
}

func TestNotionService_GetAuthURL(t *testing.T) {
	cfg := &config.NotionConfig{
		ClientID:    "test-client-id",
		RedirectURI: "https://example.com/callback",
	}

	service, err := NewNotionService(cfg, "12345678901234567890123456789012", nil, nil)
	assert.NoError(t, err)

	url := service.GetAuthURL()
	assert.Contains(t, url, "client_id=test-client-id")
	assert.Contains(t, url, "redirect_uri=https%3A%2F%2Fexample.com%2Fcallback")
	assert.Contains(t, url, "response_type=code")
	assert.Contains(t, url, "owner=user")
}

func TestNotionService_HandleCallback_Success(t *testing.T) {
	cfg := &config.NotionConfig{
		ClientID:     "test-client-id",
		ClientSecret: "test-client-secret",
		RedirectURI:  "https://example.com/callback",
	}

	mockRepo := new(MockIntegrationRepository)
	mockRepo.On("CreateOrUpdate", mock.AnythingOfType("*models.Integration")).Return(nil)

	mockTransport := new(MockRoundTripper)
	httpClient := &http.Client{Transport: mockTransport}

	service, err := NewNotionService(cfg, "12345678901234567890123456789012", mockRepo, httpClient)
	assert.NoError(t, err)

	// Mock token exchange response
	tokenResponse := `{"access_token": "test-token", "workspace_id": "test-workspace"}`
	mockTransport.On("RoundTrip", mock.MatchedBy(func(req *http.Request) bool {
		return req.URL.Path == "/v1/oauth/token"
	})).Return(&http.Response{
		StatusCode: http.StatusOK,
		Body:       io.NopCloser(bytes.NewBufferString(tokenResponse)),
	}, nil).Once()

	// Mock page creation response
	pageResponse := `{"id": "test-page-id"}`
	mockTransport.On("RoundTrip", mock.MatchedBy(func(req *http.Request) bool {
		return req.URL.Path == "/v1/pages"
	})).Return(&http.Response{
		StatusCode: http.StatusOK,
		Body:       io.NopCloser(bytes.NewBufferString(pageResponse)),
	}, nil).Once()

	err = service.HandleCallback("test-code", 1)
	assert.NoError(t, err)

	mockRepo.AssertExpectations(t)
	mockTransport.AssertExpectations(t)
}

func TestNotionService_HandleCallback_TokenError(t *testing.T) {
	cfg := &config.NotionConfig{}
	mockTransport := new(MockRoundTripper)
	httpClient := &http.Client{Transport: mockTransport}
	service, err := NewNotionService(cfg, "12345678901234567890123456789012", nil, httpClient)
	assert.NoError(t, err)

	// Token error
	mockTransport.On("RoundTrip", mock.MatchedBy(func(req *http.Request) bool {
		return req.URL.Path == "/v1/oauth/token"
	})).Return(nil, errors.New("network error")).Once()

	err = service.HandleCallback("test-code", 1)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "failed to exchange token")
}

func TestNotionService_HandleCallback_PageError(t *testing.T) {
	cfg := &config.NotionConfig{}
	mockTransport := new(MockRoundTripper)
	httpClient := &http.Client{Transport: mockTransport}
	service, err := NewNotionService(cfg, "12345678901234567890123456789012", nil, httpClient)
	assert.NoError(t, err)

	// Token success
	tokenResponse := `{"access_token": "test-token", "workspace_id": "test-workspace"}`
	mockTransport.On("RoundTrip", mock.MatchedBy(func(req *http.Request) bool {
		return req.URL.Path == "/v1/oauth/token"
	})).Return(&http.Response{
		StatusCode: http.StatusOK,
		Body:       io.NopCloser(bytes.NewBufferString(tokenResponse)),
	}, nil).Once()

	// Page error
	mockTransport.On("RoundTrip", mock.MatchedBy(func(req *http.Request) bool {
		return req.URL.Path == "/v1/pages"
	})).Return(&http.Response{
		StatusCode: http.StatusBadRequest,
		Body:       io.NopCloser(bytes.NewBufferString("bad request")),
	}, nil).Once()

	err = service.HandleCallback("test-code", 1)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "failed to create app page")
}
