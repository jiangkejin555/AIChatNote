package utils

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func TestSendError(t *testing.T) {
	tests := []struct {
		name       string
		status     int
		errorCode  string
		message    string
		wantStatus int
	}{
		{
			name:       "bad request",
			status:     http.StatusBadRequest,
			errorCode:  "invalid_request",
			message:    "Invalid request body",
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "unauthorized",
			status:     http.StatusUnauthorized,
			errorCode:  "unauthorized",
			message:    "Missing or invalid token",
			wantStatus: http.StatusUnauthorized,
		},
		{
			name:       "not found",
			status:     http.StatusNotFound,
			errorCode:  "not_found",
			message:    "Resource not found",
			wantStatus: http.StatusNotFound,
		},
		{
			name:       "internal server error",
			status:     http.StatusInternalServerError,
			errorCode:  "internal_error",
			message:    "Something went wrong",
			wantStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			SendError(c, tt.status, tt.errorCode, tt.message)

			assert.Equal(t, tt.wantStatus, w.Code)
			assert.Equal(t, "application/json; charset=utf-8", w.Header().Get("Content-Type"))

			var response ErrorResponse
			err := json.Unmarshal(w.Body.Bytes(), &response)
			require.NoError(t, err)
			assert.Equal(t, tt.errorCode, response.Error)
			assert.Equal(t, tt.message, response.Message)
		})
	}
}

func TestSendSuccess(t *testing.T) {
	tests := []struct {
		name    string
		message string
	}{
		{
			name:    "simple message",
			message: "Operation successful",
		},
		{
			name:    "empty message",
			message: "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			SendSuccess(c, tt.message)

			assert.Equal(t, http.StatusOK, w.Code)
			assert.Equal(t, "application/json; charset=utf-8", w.Header().Get("Content-Type"))

			var response map[string]string
			err := json.Unmarshal(w.Body.Bytes(), &response)
			require.NoError(t, err)
			assert.Equal(t, tt.message, response["message"])
		})
	}
}

func TestSendData(t *testing.T) {
	tests := []struct {
		name       string
		status     int
		data       interface{}
		wantStatus int
	}{
		{
			name:       "object data",
			status:     http.StatusOK,
			data:       map[string]string{"name": "test"},
			wantStatus: http.StatusOK,
		},
		{
			name:       "array data",
			status:     http.StatusOK,
			data:       []string{"item1", "item2"},
			wantStatus: http.StatusOK,
		},
		{
			name:       "nil data",
			status:     http.StatusOK,
			data:       nil,
			wantStatus: http.StatusOK,
		},
		{
			name:       "custom status",
			status:     http.StatusAccepted,
			data:       map[string]int{"id": 1},
			wantStatus: http.StatusAccepted,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			SendData(c, tt.status, tt.data)

			assert.Equal(t, tt.wantStatus, w.Code)
			assert.Equal(t, "application/json; charset=utf-8", w.Header().Get("Content-Type"))

			var response map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &response)
			require.NoError(t, err)
			assert.Contains(t, response, "data")
		})
	}
}

func TestSendCreated(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	data := map[string]string{"id": "123", "name": "test"}
	SendCreated(c, data)

	assert.Equal(t, http.StatusCreated, w.Code)
	assert.Equal(t, "application/json; charset=utf-8", w.Header().Get("Content-Type"))

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	require.NoError(t, err)
	assert.Contains(t, response, "data")

	responseData, ok := response["data"].(map[string]interface{})
	require.True(t, ok)
	assert.Equal(t, "123", responseData["id"])
	assert.Equal(t, "test", responseData["name"])
}
