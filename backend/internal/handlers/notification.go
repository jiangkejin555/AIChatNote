package handlers

import (
	"net/http"
	"strconv"

	"github.com/chat-note/backend/internal/middleware"
	"github.com/chat-note/backend/internal/models"
	"github.com/chat-note/backend/internal/repository"
	"github.com/chat-note/backend/internal/utils"
	"github.com/gin-gonic/gin"
)

type NotificationHandler struct {
	notificationRepo *repository.NotificationRepository
}

func NewNotificationHandler() *NotificationHandler {
	return &NotificationHandler{
		notificationRepo: repository.NewNotificationRepository(),
	}
}

type CreateTestNotificationRequest struct {
	Type    string                     `json:"type" binding:"required"`
	Title   string                     `json:"title" binding:"required"`
	Content string                     `json:"content" binding:"required"`
	Payload models.NotificationPayload `json:"payload"`
}

// List returns notifications with optional filters
func (h *NotificationHandler) List(c *gin.Context) {
	userID := middleware.GetUserID(c)

	// Parse query parameters
	filters := repository.NotificationFilters{}

	if notificationType := c.Query("type"); notificationType != "" {
		filters.Type = notificationType
	}

	if unread := c.Query("unread"); unread == "true" {
		filters.Unread = true
	}

	// Parse pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	filters.Limit = pageSize
	filters.Offset = (page - 1) * pageSize

	notifications, total, err := h.notificationRepo.FindByUserID(userID, filters)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "db_error", "Failed to fetch notifications", err)
		return
	}

	// Get unread count
	unreadCount, err := h.notificationRepo.GetUnreadCount(userID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "db_error", "Failed to get unread count", err)
		return
	}

	utils.LogOperationSuccess("NotificationHandler", "List", "userID", userID, "total", total, "count", len(notifications))
	c.JSON(http.StatusOK, gin.H{
		"data":         notifications,
		"total":        total,
		"page":         page,
		"page_size":    pageSize,
		"unread_count": unreadCount,
	})
}

// GetUnreadCount returns the count of unread notifications
func (h *NotificationHandler) GetUnreadCount(c *gin.Context) {
	userID := middleware.GetUserID(c)

	count, err := h.notificationRepo.GetUnreadCount(userID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "db_error", "Failed to get unread count", err)
		return
	}
	utils.LogOperationSuccess("NotificationHandler", "GetUnreadCount", "userID", userID, "count", count)
	c.JSON(http.StatusOK, gin.H{"count": count})
}

// MarkAsRead marks a notification as read
func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	userID := middleware.GetUserID(c)

	notificationID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid notification ID")
		return
	}

	if err := h.notificationRepo.MarkAsRead(uint(notificationID), userID); err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "update_error", "Failed to mark notification as read", err)
		return
	}

	utils.LogOperationSuccess("NotificationHandler", "MarkAsRead", "notificationID", notificationID, "userID", userID)
	c.JSON(http.StatusOK, gin.H{"message": "Notification marked as read"})
}

// MarkAllAsRead marks all notifications as read for the current user
func (h *NotificationHandler) MarkAllAsRead(c *gin.Context) {
	userID := middleware.GetUserID(c)

	count, err := h.notificationRepo.MarkAllAsRead(userID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "update_error", "Failed to mark all notifications as read", err)
		return
	}

	utils.LogOperationSuccess("NotificationHandler", "MarkAllAsRead", "userID", userID, "count", count)
	c.JSON(http.StatusOK, gin.H{
		"message":  "All notifications marked as read",
		"affected": count,
	})
}

// Delete deletes a notification
func (h *NotificationHandler) Delete(c *gin.Context) {
	userID := middleware.GetUserID(c)

	notificationID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid notification ID")
		return
	}

	if err := h.notificationRepo.Delete(uint(notificationID), userID); err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "delete_error", "Failed to delete notification", err)
		return
	}

	utils.LogOperationSuccess("NotificationHandler", "Delete", "notificationID", notificationID, "userID", userID)
	c.JSON(http.StatusOK, gin.H{"message": "Notification deleted"})
}

// DeleteAll deletes all notifications for the current user, optionally filtered by type
func (h *NotificationHandler) DeleteAll(c *gin.Context) {
	userID := middleware.GetUserID(c)

	notificationType := c.Query("type")

	count, err := h.notificationRepo.DeleteAll(userID, notificationType)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "delete_error", "Failed to delete notifications", err)
		return
	}

	utils.LogOperationSuccess("NotificationHandler", "DeleteAll", "userID", userID, "type", notificationType, "count", count)
	c.JSON(http.StatusOK, gin.H{
		"message":  "Notifications deleted",
		"affected": count,
	})
}

// CreateForTesting creates a test notification (for development/testing purposes)
func (h *NotificationHandler) CreateForTesting(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req CreateTestNotificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	// Validate type
	validTypes := map[string]bool{
		string(models.MessageTypeSystem): true,
		string(models.MessageTypeAITask): true,
		string(models.MessageTypeError):  true,
	}
	if !validTypes[req.Type] {
		utils.SendError(c, http.StatusBadRequest, "invalid_type", "Invalid notification type. Must be one of: system, ai_task, error")
		return
	}

	notification := &models.Notification{
		UserID:  userID,
		Type:    models.MessageType(req.Type),
		Title:   req.Title,
		Content: req.Content,
		Payload: req.Payload,
	}

	if err := h.notificationRepo.Create(notification); err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "create_error", "Failed to create notification", err)
		return
	}

	utils.LogOperationSuccess("NotificationHandler", "CreateForTesting", "notificationID", notification.ID, "userID", userID, "type", req.Type)
	c.JSON(http.StatusCreated, gin.H{"data": notification})
}
