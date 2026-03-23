package utils

import (
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
)

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}

func SendError(c *gin.Context, status int, errorCode, message string) {
	slog.Error("request failed",
		"method", c.Request.Method,
		"path", c.Request.URL.Path,
		"status", status,
		"errorCode", errorCode,
		"message", message,
	)
	c.JSON(status, ErrorResponse{
		Error:   errorCode,
		Message: message,
	})
}

// SendErrorWithErr records error details in logs but returns only the message to client
func SendErrorWithErr(c *gin.Context, status int, errorCode, message string, err error) {
	slog.Error("request failed",
		"method", c.Request.Method,
		"path", c.Request.URL.Path,
		"status", status,
		"errorCode", errorCode,
		"message", message,
		"error", err,
	)
	c.JSON(status, ErrorResponse{
		Error:   errorCode,
		Message: message,
	})
}

func SendSuccess(c *gin.Context, message string) {
	slog.Info("request success",
		"method", c.Request.Method,
		"path", c.Request.URL.Path,
		"message", message,
	)
	c.JSON(http.StatusOK, gin.H{"message": message})
}

func SendData(c *gin.Context, status int, data interface{}) {
	c.JSON(status, gin.H{"data": data})
}

func SendCreated(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, gin.H{"data": data})
}
