package repository

import (
	"strings"
	"time"

	"github.com/chat-note/backend/internal/database"
	"github.com/chat-note/backend/internal/models"
)

type NotificationRepository struct{}

func NewNotificationRepository() *NotificationRepository {
	return &NotificationRepository{}
}

// Create creates a new notification
func (r *NotificationRepository) Create(notification *models.Notification) error {
	return database.DB.Create(notification).Error
}

// NotificationFilters contains filter options for querying notifications
type NotificationFilters struct {
	Type   string // Filter by message type (system, ai_task, error)
	Unread bool   // Filter unread notifications only
	Limit  int    // Pagination limit
	Offset int    // Pagination offset
}

// FindByUserID retrieves notifications for a user with filtering and pagination
func (r *NotificationRepository) FindByUserID(userID uint, filters NotificationFilters) ([]models.Notification, int64, error) {
	var notifications []models.Notification
	var total int64

	query := database.DB.Model(&models.Notification{}).Where("user_id = ?", userID)

	// Apply type filter
	if filters.Type != "" {
		query = query.Where("type = ?", filters.Type)
	}

	// Apply unread filter
	if filters.Unread {
		query = query.Where("read_at IS NULL")
	}

	// Get total count before pagination
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	if filters.Limit > 0 {
		query = query.Limit(filters.Limit)
	}
	if filters.Offset > 0 {
		query = query.Offset(filters.Offset)
	}

	err := query.Order("created_at DESC").Find(&notifications).Error
	return notifications, total, err
}

// FindRecentByUserID retrieves the most recent notifications for a user
func (r *NotificationRepository) FindRecentByUserID(userID uint, limit int) ([]models.Notification, error) {
	var notifications []models.Notification
	query := database.DB.Where("user_id = ?", userID)

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Order("created_at DESC").Find(&notifications).Error
	return notifications, err
}

// FindByIDAndUserID retrieves a specific notification by ID and user ID
func (r *NotificationRepository) FindByIDAndUserID(id, userID uint) (*models.Notification, error) {
	var notification models.Notification
	err := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&notification).Error
	if err != nil {
		return nil, err
	}
	return &notification, nil
}

// MarkAsRead marks a notification as read
func (r *NotificationRepository) MarkAsRead(id, userID uint) error {
	now := time.Now()
	return database.DB.Model(&models.Notification{}).
		Where("id = ? AND user_id = ? AND read_at IS NULL", id, userID).
		Update("read_at", now).Error
}

// MarkAllAsRead marks all notifications as read for a user
func (r *NotificationRepository) MarkAllAsRead(userID uint) (int64, error) {
	now := time.Now()
	result := database.DB.Model(&models.Notification{}).
		Where("user_id = ? AND read_at IS NULL", userID).
		Update("read_at", now)
	return result.RowsAffected, result.Error
}

// Delete deletes a notification by ID and user ID
func (r *NotificationRepository) Delete(id, userID uint) error {
	return database.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Notification{}).Error
}

// DeleteAll deletes all notifications for a user, optionally filtered by type
func (r *NotificationRepository) DeleteAll(userID uint, notificationType string) (int64, error) {
	query := database.DB.Where("user_id = ?", userID)
	if notificationType != "" {
		query = query.Where("type = ?", notificationType)
	}
	result := query.Delete(&models.Notification{})
	return result.RowsAffected, result.Error
}

// GetUnreadCount returns the count of unread notifications for a user
func (r *NotificationRepository) GetUnreadCount(userID uint) (int64, error) {
	var count int64
	err := database.DB.Model(&models.Notification{}).
		Where("user_id = ? AND read_at IS NULL", userID).
		Count(&count).Error
	return count, err
}

// TemplateDefinition contains the definition for a notification template
type TemplateDefinition struct {
	Code         string
	Type         models.MessageType
	Title        string
	Content      string
	ResourceType string
}

// getTemplate returns a template definition by code
// Note: note_saved, note_save_failed, model_config_error are handled by toast, not notifications
func getTemplate(code string) (TemplateDefinition, bool) {
	templates := map[string]TemplateDefinition{
		// AI Task notifications
		"ai_summary_done": {
			Code:         "ai_summary_done",
			Type:         models.MessageTypeAITask,
			Title:        "AI 总结完成",
			Content:      "对话的 AI 总结已完成，已生成笔记「{{title}}」",
			ResourceType: "note",
		},
		"ai_summary_failed": {
			Code:         "ai_summary_failed",
			Type:         models.MessageTypeError,
			Title:        "AI 总结失败",
			Content:      "AI 总结失败：{{error}}",
			ResourceType: "",
		},
		// System notifications
		"welcome": {
			Code:         "welcome",
			Type:         models.MessageTypeSystem,
			Title:        "欢迎加入 ChatNote",
			Content:      "你好，{{username}}！非常高兴你成为我们的第 {{user_count}} 位用户。\n\n在这里，你可以：\n• 与 AI 对话，自动生成笔记\n• 管理和整理你的知识库\n• 使用多种 AI 模型\n\n如有任何问题，欢迎随时联系我们。祝你使用愉快！",
			ResourceType: "",
		},
		"system_announcement": {
			Code:         "system_announcement",
			Type:         models.MessageTypeSystem,
			Title:        "系统公告",
			Content:      "{{content}}",
			ResourceType: "announcement",
		},
		"account_security": {
			Code:         "account_security",
			Type:         models.MessageTypeSystem,
			Title:        "账户安全提醒",
			Content:      "{{content}}",
			ResourceType: "",
		},
		// Error notifications
		"api_error": {
			Code:         "api_error",
			Type:         models.MessageTypeError,
			Title:        "API 调用错误",
			Content:      "{{api_name}} 调用失败：{{error}}",
			ResourceType: "",
		},
	}

	t, ok := templates[code]
	return t, ok
}

// renderTemplate renders a template string with variables
func renderTemplate(template string, vars map[string]string) string {
	result := template
	for k, v := range vars {
		result = strings.ReplaceAll(result, "{{"+k+"}}", v)
	}
	return result
}

// CreateFromTemplate creates a notification from a template code
func (r *NotificationRepository) CreateFromTemplate(userID uint, templateCode string, vars map[string]string, payload models.NotificationPayload) (*models.Notification, error) {
	template, ok := getTemplate(templateCode)
	if !ok {
		template = TemplateDefinition{
			Code:    templateCode,
			Type:    models.MessageTypeSystem,
			Title:   "未知消息",
			Content: "无法找到消息模板",
		}
	}

	title := renderTemplate(template.Title, vars)
	content := renderTemplate(template.Content, vars)

	notification := &models.Notification{
		UserID:       userID,
		TemplateCode: templateCode,
		Type:         template.Type,
		Title:        title,
		Content:      content,
		Payload:      payload,
	}

	if err := r.Create(notification); err != nil {
		return nil, err
	}

	return notification, nil
}
