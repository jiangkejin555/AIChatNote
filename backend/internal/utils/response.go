package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}

func SendError(c *gin.Context, status int, errorCode, message string) {
	c.JSON(status, ErrorResponse{
		Error:   errorCode,
		Message: message,
	})
}

func SendSuccess(c *gin.Context, message string) {
	c.JSON(http.StatusOK, gin.H{"message": message})
}

func SendData(c *gin.Context, status int, data interface{}) {
	c.JSON(status, gin.H{"data": data})
}

func SendCreated(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, gin.H{"data": data})
}
