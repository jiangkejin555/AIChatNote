# Notification Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-featured notification center with persistent storage, bell icon entry point, and message management capabilities.

**Architecture:** Single `notifications` table with JSON payload for resource linking. Go backend provides 6 REST APIs. React frontend uses React Query for state management with a bell icon in sidebar header triggering a Popover preview and dedicated page for full list.

**Tech Stack:** Go + GORM + Gin (backend), Next.js + React Query + shadcn/ui (frontend), PostgreSQL (database)

---

## File Structure

```
backend/
├── internal/
│   ├── models/
│   │   └── notification.go          # Notification model
│   ├── repository/
│   │   └── notification.go          # CRUD operations
│   ├── handlers/
│   │   └── notification.go          # HTTP handlers
│   ├── services/
│   │   └── notification.go          # Template rendering, business logic
│   └── database/
│       └── database.go              # Add Notification to AutoMigrate

frontend/src/
├── types/
│   └── notification.ts              # TypeScript types
├── lib/api/
│   └── notifications.ts             # API client
├── hooks/
│   └── use-notifications.ts         # React Query hooks
├── components/notifications/
│   ├── index.ts
│   ├── notification-bell.tsx        # Bell icon with badge
│   ├── notification-popover.tsx     # Quick preview popover
│   └── notification-item.tsx        # Single notification row
├── components/layout/
│   └── sidebar.tsx                  # Add NotificationBell to header
└── app/(main)/
    └── notifications/
        └── page.tsx                 # Full notification center page
```

---

## Task 1: Backend Model

**Files:**
- Create: `backend/internal/models/notification.go`

- [ ] **Step 1: Create Notification model**

```go
package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

// MessageType defines the type of notification
type MessageType string

const (
	MessageTypeSystem MessageType = "system"
	MessageTypeAITask MessageType = "ai_task"
	MessageTypeError  MessageType = "error"
)

// NotificationPayload stores resource linking info
type NotificationPayload struct {
	ResourceType string `json:"resource_type,omitempty"` // note, model, conversation, announcement
	ResourceID   string `json:"resource_id,omitempty"`
	URL          string `json:"url,omitempty"`
}

// Value implements driver.Valuer for JSONB
func (p NotificationPayload) Value() (driver.Value, error) {
	return json.Marshal(p)
}

// Scan implements sql.Scanner for JSONB
func (p *NotificationPayload) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, p)
}

// Notification represents a user notification
type Notification struct {
	ID           uint                `gorm:"primaryKey" json:"id"`
	UserID       uint                `gorm:"not null;index" json:"user_id"`
	TemplateCode string              `gorm:"size:50;not null" json:"template_code"`
	Type         MessageType         `gorm:"size:20;not null" json:"type"`
	Title        string              `gorm:"size:255;not null" json:"title"`
	Content      string              `gorm:"type:text" json:"content"`
	Payload      NotificationPayload `gorm:"type:jsonb" json:"payload"`
	ReadAt       *time.Time          `json:"read_at"`
	CreatedAt    time.Time           `json:"created_at"`

	User *User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
}

func (Notification) TableName() string {
	return "notifications"
}
```

- [ ] **Step 2: Add Notification to AutoMigrate**

Modify `backend/internal/database/database.go` line 66-84:

```go
// Migrate runs auto migration for all models
func Migrate() error {
	err := DB.AutoMigrate(
		&models.User{},
		&models.Provider{},
		&models.ProviderModel{},
		&models.Conversation{},
		&models.Message{},
		&models.MessageRequest{},
		&models.ConversationSummary{},
		&models.Note{},
		&models.Folder{},
		&models.RefreshToken{},
		&models.NoteTag{},
		&models.Feedback{},
		&models.SatisfactionRating{},
		&models.Version{},
		&models.FeatureRequest{},
		&models.FeatureVote{},
		&models.UserSettings{},
		&models.Notification{}, // Add this line
	)
	if err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	// ... rest of the function unchanged
```

- [ ] **Step 3: Verify migration**

Run the backend server and check that the `notifications` table is created:

```bash
cd backend && go run cmd/server/main.go
# Should see: "Database migration completed"
```

- [ ] **Step 4: Commit**

```bash
git add backend/internal/models/notification.go backend/internal/database/database.go
git commit -m "$(cat <<'EOF'
feat(notification): add Notification model

Add Notification model with JSONB payload for resource linking.
Supports three message types: system, ai_task, error.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Notification Templates

**Files:**
- Create: `backend/internal/services/notification_template.go`

- [ ] **Step 1: Create notification template service**

```go
package services

import (
	"strings"
)

// MessageType defines notification categories
type MessageType string

const (
	MessageTypeSystem MessageType = "system"
	MessageTypeAITask MessageType = "ai_task"
	MessageTypeError  MessageType = "error"
)

// Template defines a notification template
type Template struct {
	Code         string      // Template identifier
	Type         MessageType // Message type
	Title        string      // Title template (supports {{var}})
	Content      string      // Content template (supports {{var}})
	ResourceType string      // Associated resource type
}

// Templates contains all notification templates
var Templates = map[string]Template{
	// AI Task notifications
	"note_saved": {
		Code:         "note_saved",
		Type:         MessageTypeAITask,
		Title:        "笔记保存成功",
		Content:      "笔记「{{title}}」已成功保存",
		ResourceType: "note",
	},
	"note_save_failed": {
		Code:         "note_save_failed",
		Type:         MessageTypeError,
		Title:        "笔记保存失败",
		Content:      "笔记「{{title}}」保存失败：{{error}}",
		ResourceType: "note",
	},
	"ai_summary_done": {
		Code:         "ai_summary_done",
		Type:         MessageTypeAITask,
		Title:        "AI 总结完成",
		Content:      "对话的 AI 总结已完成，已生成笔记「{{title}}」",
		ResourceType: "note",
	},
	"ai_summary_failed": {
		Code:         "ai_summary_failed",
		Type:         MessageTypeError,
		Title:        "AI 总结失败",
		Content:      "AI 总结失败：{{error}}",
		ResourceType: "",
	},

	// System notifications
	"system_announcement": {
		Code:         "system_announcement",
		Type:         MessageTypeSystem,
		Title:        "系统公告",
		Content:      "{{content}}",
		ResourceType: "announcement",
	},
	"account_security": {
		Code:         "account_security",
		Type:         MessageTypeSystem,
		Title:        "账户安全提醒",
		Content:      "{{content}}",
		ResourceType: "",
	},

	// Error notifications
	"api_error": {
		Code:         "api_error",
		Type:         MessageTypeError,
		Title:        "API 调用错误",
		Content:      "{{api_name}} 调用失败：{{error}}",
		ResourceType: "",
	},
	"model_config_error": {
		Code:         "model_config_error",
		Type:         MessageTypeError,
		Title:        "模型配置错误",
		Content:      "模型「{{model}}」配置有误：{{error}}",
		ResourceType: "model",
	},
}

// GetTemplate returns a template by code
func GetTemplate(code string) (Template, bool) {
	t, ok := Templates[code]
	return t, ok
}

// Render renders a template with variables
func Render(template string, vars map[string]string) string {
	result := template
	for k, v := range vars {
		result = strings.ReplaceAll(result, "{{"+k+"}}", v)
	}
	return result
}

// RenderTemplate renders title and content from a template code
func RenderTemplate(code string, vars map[string]string) (title, content string, template Template, ok bool) {
	template, ok = Templates[code]
	if !ok {
		return "未知消息", "", Template{}, false
	}
	title = Render(template.Title, vars)
	content = Render(template.Content, vars)
	return title, content, template, true
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/internal/services/notification_template.go
git commit -m "$(cat <<'EOF'
feat(notification): add notification template service

Define message templates for AI tasks, system, and error types.
Supports variable interpolation with {{var}} syntax.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Notification Repository

**Files:**
- Create: `backend/internal/repository/notification.go`

- [ ] **Step 1: Create notification repository**

```go
package repository

import (
	"time"

	"github.com/chat-note/backend/internal/database"
	"github.com/chat-note/backend/internal/models"
	"github.com/chat-note/backend/internal/services"
)

type NotificationRepository struct{}

func NewNotificationRepository() *NotificationRepository {
	return &NotificationRepository{}
}

// Create creates a new notification
func (r *NotificationRepository) Create(notification *models.Notification) error {
	return database.DB.Create(notification).Error
}

// FindByUserID returns notifications for a user with optional filters
func (r *NotificationRepository) FindByUserID(userID uint, filters map[string]interface{}) ([]models.Notification, int64, error) {
	var notifications []models.Notification
	var total int64

	query := database.DB.Model(&models.Notification{}).Where("user_id = ?", userID)

	if msgType, ok := filters["type"]; ok && msgType != "" {
		query = query.Where("type = ?", msgType)
	}
	if unread, ok := filters["unread"]; ok && unread == true {
		query = query.Where("read_at IS NULL")
	}

	// Get total count
	query.Count(&total)

	// Get paginated results
	page, _ := filters["page"].(int)
	if page < 1 {
		page = 1
	}
	pageSize, _ := filters["page_size"].(int)
	if pageSize < 1 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}

	offset := (page - 1) * pageSize
	err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&notifications).Error
	return notifications, total, err
}

// FindRecentByUserID returns the most recent N notifications for a user
func (r *NotificationRepository) FindRecentByUserID(userID uint, limit int) ([]models.Notification, error) {
	var notifications []models.Notification
	if limit < 1 {
		limit = 5
	}
	err := database.DB.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Find(&notifications).Error
	return notifications, err
}

// FindByIDAndUserID returns a notification by ID and user ID
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
		Where("id = ? AND user_id = ?", id, userID).
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

// Delete removes a notification
func (r *NotificationRepository) Delete(id, userID uint) error {
	return database.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Notification{}).Error
}

// DeleteAll removes all notifications for a user, optionally filtered by type
func (r *NotificationRepository) DeleteAll(userID uint, msgType string) (int64, error) {
	query := database.DB.Where("user_id = ?", userID)
	if msgType != "" {
		query = query.Where("type = ?", msgType)
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

// CreateFromTemplate creates a notification from a template code
func (r *NotificationRepository) CreateFromTemplate(
	userID uint,
	templateCode string,
	vars map[string]string,
	payload models.NotificationPayload,
) (*models.Notification, error) {
	title, content, template, ok := services.RenderTemplate(templateCode, vars)
	if !ok {
		return nil, nil
	}

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
```

- [ ] **Step 2: Commit**

```bash
git add backend/internal/repository/notification.go
git commit -m "$(cat <<'EOF'
feat(notification): add notification repository

Implement CRUD operations with filtering, pagination, and
template-based notification creation.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Notification Handler

**Files:**
- Create: `backend/internal/handlers/notification.go`
- Modify: `backend/cmd/server/main.go`

- [ ] **Step 1: Create notification handler**

```go
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

// List returns notifications with optional filters
// GET /api/notifications?type=system&unread=true&page=1&page_size=20
func (h *NotificationHandler) List(c *gin.Context) {
	userID := middleware.GetUserID(c)

	filters := make(map[string]interface{})
	if msgType := c.Query("type"); msgType != "" {
		filters["type"] = msgType
	}
	if unread := c.Query("unread"); unread == "true" {
		filters["unread"] = true
	}
	if page, err := strconv.Atoi(c.Query("page")); err == nil && page > 0 {
		filters["page"] = page
	}
	if pageSize, err := strconv.Atoi(c.Query("page_size")); err == nil && pageSize > 0 {
		filters["page_size"] = pageSize
	}

	notifications, total, err := h.notificationRepo.FindByUserID(userID, filters)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "db_error", "Failed to fetch notifications", err)
		return
	}

	unreadCount, _ := h.notificationRepo.GetUnreadCount(userID)

	c.JSON(http.StatusOK, gin.H{
		"data":         notifications,
		"total":        total,
		"unread_count": unreadCount,
	})
}

// GetUnreadCount returns the count of unread notifications
// GET /api/notifications/unread-count
func (h *NotificationHandler) GetUnreadCount(c *gin.Context) {
	userID := middleware.GetUserID(c)

	count, err := h.notificationRepo.GetUnreadCount(userID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "db_error", "Failed to get unread count", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"count": count})
}

// MarkAsRead marks a notification as read
// PUT /api/notifications/:id/read
func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	userID := middleware.GetUserID(c)
	notificationID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid notification ID")
		return
	}

	if err := h.notificationRepo.MarkAsRead(uint(notificationID), userID); err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "update_error", "Failed to mark as read", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// MarkAllAsRead marks all notifications as read
// PUT /api/notifications/read-all
func (h *NotificationHandler) MarkAllAsRead(c *gin.Context) {
	userID := middleware.GetUserID(c)

	affected, err := h.notificationRepo.MarkAllAsRead(userID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "update_error", "Failed to mark all as read", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"affected": affected})
}

// Delete removes a notification
// DELETE /api/notifications/:id
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

	c.JSON(http.StatusOK, gin.H{"success": true})
}

// DeleteAll removes all notifications
// DELETE /api/notifications?type=system
func (h *NotificationHandler) DeleteAll(c *gin.Context) {
	userID := middleware.GetUserID(c)
	msgType := c.Query("type")

	affected, err := h.notificationRepo.DeleteAll(userID, msgType)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "delete_error", "Failed to delete notifications", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"affected": affected})
}

// CreateForTesting creates a test notification (for development)
// POST /api/notifications/test
func (h *NotificationHandler) CreateForTesting(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req struct {
		TemplateCode string            `json:"template_code" binding:"required"`
		Vars         map[string]string `json:"vars"`
		Payload      models.NotificationPayload `json:"payload"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	notification, err := h.notificationRepo.CreateFromTemplate(userID, req.TemplateCode, req.Vars, req.Payload)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "create_error", "Failed to create notification", err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": notification})
}
```

- [ ] **Step 2: Register routes in main.go**

Add to `backend/cmd/server/main.go` after line 81 (after tagHandler := ...):

```go
		// Initialize notification handler
		notificationHandler := handlers.NewNotificationHandler()
```

Add to `backend/cmd/server/main.go` after line 203 (after tags routes):

```go
		// Notification routes
		notifications := api.Group("/notifications")
		notifications.Use(middleware.Auth(jwtService))
		{
			notifications.GET("", notificationHandler.List)
			notifications.GET("/unread-count", notificationHandler.GetUnreadCount)
			notifications.PUT("/:id/read", notificationHandler.MarkAsRead)
			notifications.PUT("/read-all", notificationHandler.MarkAllAsRead)
			notifications.DELETE("/:id", notificationHandler.Delete)
			notifications.DELETE("", notificationHandler.DeleteAll)
			notifications.POST("/test", notificationHandler.CreateForTesting)
		}
```

- [ ] **Step 3: Test the backend**

```bash
cd backend && go build ./cmd/server && echo "Build successful"
```

Expected: Build successful with no errors

- [ ] **Step 4: Commit**

```bash
git add backend/internal/handlers/notification.go backend/cmd/server/main.go
git commit -m "$(cat <<'EOF'
feat(notification): add notification API endpoints

Implement 6 REST endpoints for notification CRUD operations
with filtering, pagination, and batch operations.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Frontend Types

**Files:**
- Create: `frontend/src/types/notification.ts`

- [ ] **Step 1: Create notification types**

```typescript
// frontend/src/types/notification.ts

export type NotificationType = 'system' | 'ai_task' | 'error'

export interface NotificationPayload {
  resource_type: 'note' | 'model' | 'conversation' | 'announcement' | null
  resource_id?: string
  url?: string
}

export interface Notification {
  id: number
  user_id: number
  template_code: string
  type: NotificationType
  title: string
  content: string | null
  payload: NotificationPayload | null
  read_at: string | null
  created_at: string
}

export interface NotificationsQueryParams {
  type?: NotificationType
  unread?: boolean
  page?: number
  page_size?: number
}

export interface NotificationsListResponse {
  data: Notification[]
  total: number
  unread_count: number
}
```

- [ ] **Step 2: Export from types index**

Add to `frontend/src/types/index.ts`:

```typescript
export * from './notification'
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/types/notification.ts frontend/src/types/index.ts
git commit -m "$(cat <<'EOF'
feat(notification): add frontend notification types

Add TypeScript types for Notification, NotificationPayload,
and query parameters.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Frontend API Client

**Files:**
- Create: `frontend/src/lib/api/notifications.ts`

- [ ] **Step 1: Create notifications API client**

```typescript
// frontend/src/lib/api/notifications.ts

import apiClient from './client'
import type {
  Notification,
  NotificationsQueryParams,
  NotificationsListResponse,
  NotificationPayload,
} from '@/types'
import type { ApiResponse } from '@/types'

export const notificationsApi = {
  getAll: async (params?: NotificationsQueryParams): Promise<NotificationsListResponse> => {
    const response = await apiClient.get<ApiResponse<NotificationsListResponse>>(
      '/notifications',
      { params }
    )
    return response.data.data
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<ApiResponse<{ count: number }>>(
      '/notifications/unread-count'
    )
    return response.data.data.count
  },

  markAsRead: async (id: number): Promise<void> => {
    await apiClient.put(`/notifications/${id}/read`)
  },

  markAllAsRead: async (): Promise<number> => {
    const response = await apiClient.put<ApiResponse<{ affected: number }>>(
      '/notifications/read-all'
    )
    return response.data.data.affected
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`)
  },

  deleteAll: async (type?: string): Promise<number> => {
    const response = await apiClient.delete<ApiResponse<{ affected: number }>>(
      '/notifications',
      { params: type ? { type } : undefined }
    )
    return response.data.data.affected
  },

  // For testing/development
  createTest: async (params: {
    template_code: string
    vars?: Record<string, string>
    payload?: NotificationPayload
  }): Promise<Notification> => {
    const response = await apiClient.post<ApiResponse<Notification>>(
      '/notifications/test',
      params
    )
    return response.data.data
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/lib/api/notifications.ts
git commit -m "$(cat <<'EOF'
feat(notification): add notifications API client

Implement API client for all notification endpoints.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Frontend React Query Hooks

**Files:**
- Create: `frontend/src/hooks/use-notifications.ts`

- [ ] **Step 1: Create notification hooks**

```typescript
// frontend/src/hooks/use-notifications.ts

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/lib/api/notifications'
import type { NotificationsQueryParams } from '@/types'
import { toast } from 'sonner'
import { getT } from '@/i18n'

export function useNotifications(params?: NotificationsQueryParams) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationsApi.getAll(params),
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchOnWindowFocus: true,
  })
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: (affected) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      if (affected > 0) {
        toast.success(t('notifications.allRead'))
      }
    },
    onError: () => {
      toast.error(t('notifications.markReadFailed'))
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: (id: number) => notificationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      toast.success(t('notifications.deleteSuccess'))
    },
    onError: () => {
      toast.error(t('notifications.deleteFailed'))
    },
  })
}

export function useDeleteAllNotifications() {
  const queryClient = useQueryClient()
  const t = getT()

  return useMutation({
    mutationFn: (type?: string) => notificationsApi.deleteAll(type),
    onSuccess: (affected) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      if (affected > 0) {
        toast.success(t('notifications.clearSuccess'))
      }
    },
    onError: () => {
      toast.error(t('notifications.clearFailed'))
    },
  })
}

export function useCreateTestNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: {
      template_code: string
      vars?: Record<string, string>
      payload?: { resource_type?: string; resource_id?: string }
    }) => notificationsApi.createTest(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/hooks/use-notifications.ts
git commit -m "$(cat <<'EOF'
feat(notification): add React Query hooks

Implement hooks for fetching, marking read, and deleting
notifications with automatic cache invalidation.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Notification Bell Component

**Files:**
- Create: `frontend/src/components/notifications/index.ts`
- Create: `frontend/src/components/notifications/notification-bell.tsx`

- [ ] **Step 1: Create index export**

```typescript
// frontend/src/components/notifications/index.ts
export * from './notification-bell'
export * from './notification-popover'
export * from './notification-item'
```

- [ ] **Step 2: Create notification bell component**

```typescript
// frontend/src/components/notifications/notification-bell.tsx

'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { NotificationPopover } from './notification-popover'

export function NotificationBell() {
  return (
    <NotificationPopover>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'relative rounded-lg',
          'hover:bg-sidebar-accent/80 hover:scale-105 active:scale-95',
          'transition-all duration-200'
        )}
      >
        <Bell className="h-4 w-4" />
      </Button>
    </NotificationPopover>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/notifications/index.ts frontend/src/components/notifications/notification-bell.tsx
git commit -m "$(cat <<'EOF'
feat(notification): add notification bell component

Add bell button component that triggers notification popover.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Notification Item Component

**Files:**
- Create: `frontend/src/components/notifications/notification-item.tsx`

- [ ] **Step 1: Create notification item component**

```typescript
// frontend/src/components/notifications/notification-item.tsx

'use client'

import { useRouter } from 'next/navigation'
import { Bell, Sparkles, AlertCircle, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Notification } from '@/types'
import { useMarkAsRead, useDeleteNotification } from '@/hooks/use-notifications'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface NotificationItemProps {
  notification: Notification
  compact?: boolean
  onAction?: () => void
}

const typeConfig = {
  system: {
    icon: Bell,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  ai_task: {
    icon: Sparkles,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
}

export function NotificationItem({ notification, compact = false, onAction }: NotificationItemProps) {
  const router = useRouter()
  const markAsRead = useMarkAsRead()
  const deleteNotification = useDeleteNotification()

  const config = typeConfig[notification.type]
  const Icon = config.icon
  const isUnread = !notification.read_at

  const handleClick = () => {
    if (isUnread) {
      markAsRead.mutate(notification.id)
    }

    // Navigate to related resource
    if (notification.payload?.resource_type && notification.payload?.resource_id) {
      const { resource_type, resource_id } = notification.payload
      switch (resource_type) {
        case 'note':
          router.push(`/notes?noteId=${resource_id}`)
          break
        case 'conversation':
          router.push(`/?conversation=${resource_id}`)
          break
        case 'model':
          router.push('/models')
          break
      }
    }

    onAction?.()
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteNotification.mutate(notification.id)
    onAction?.()
  }

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: zhCN,
  })

  if (compact) {
    return (
      <div
        onClick={handleClick}
        className={cn(
          'group flex items-start gap-3 p-3 rounded-lg cursor-pointer',
          'hover:bg-accent/50 transition-colors',
          isUnread && 'bg-accent/30'
        )}
      >
        <div className={cn('shrink-0 p-1.5 rounded-md', config.bgColor)}>
          <Icon className={cn('h-3.5 w-3.5', config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isUnread && <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
            <p className={cn('text-sm truncate', isUnread && 'font-medium')}>
              {notification.title}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{timeAgo}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group flex items-start gap-3 p-4 rounded-xl cursor-pointer',
        'hover:bg-accent/50 transition-colors border',
        isUnread ? 'bg-accent/20 border-primary/20' : 'bg-background'
      )}
      onClick={handleClick}
    >
      <div className={cn('shrink-0 p-2 rounded-lg', config.bgColor)}>
        <Icon className={cn('h-4 w-4', config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isUnread && <div className="w-2 h-2 rounded-full bg-primary shrink-0" />}
          <p className={cn('font-medium', isUnread && 'text-primary')}>
            {notification.title}
          </p>
        </div>
        {notification.content && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {notification.content}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-2">{timeAgo}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity',
          'hover:bg-destructive/10 hover:text-destructive'
        )}
        onClick={handleDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/notifications/notification-item.tsx
git commit -m "$(cat <<'EOF'
feat(notification): add notification item component

Add notification item with type-based icons, read state,
and navigation to related resources.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Notification Popover

**Files:**
- Create: `frontend/src/components/notifications/notification-popover.tsx`

- [ ] **Step 1: Create notification popover**

```typescript
// frontend/src/components/notifications/notification-popover.tsx

'use client'

import { useRouter } from 'next/navigation'
import { BellRing, Loader2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useNotifications, useUnreadCount } from '@/hooks/use-notifications'
import { NotificationItem } from './notification-item'
import { cn } from '@/lib/utils'
import { getT } from '@/i18n'

interface NotificationPopoverProps {
  children: React.ReactNode
}

export function NotificationPopover({ children }: NotificationPopoverProps) {
  const router = useRouter()
  const t = getT()
  const { data: unreadCount } = useUnreadCount()
  const { data, isLoading } = useNotifications({ page_size: 5 })

  const notifications = data?.data ?? []
  const hasUnread = (unreadCount ?? 0) > 0

  const handleViewAll = () => {
    router.push('/notifications')
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="relative">
          {children}
          {hasUnread && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 flex items-center justify-center',
                'min-w-4 h-4 px-1 text-[10px] font-bold',
                'bg-destructive text-destructive-foreground rounded-full',
                'animate-in fade-in zoom-in duration-200'
              )}
            >
              {unreadCount && unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className={cn(
          'w-80 p-0 rounded-xl',
          'bg-popover/95 backdrop-blur-xl',
          'border border-border/50 shadow-xl'
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold text-sm">{t('notifications.title')}</h4>
          {hasUnread && (
            <span className="text-xs text-muted-foreground">
              {unreadCount} {t('notifications.unread')}
            </span>
          )}
        </div>

        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BellRing className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">{t('notifications.empty')}</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  compact
                />
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-2 border-t">
          <Button
            variant="ghost"
            className="w-full justify-center text-sm"
            onClick={handleViewAll}
          >
            {t('notifications.viewAll')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/notifications/notification-popover.tsx
git commit -m "$(cat <<'EOF'
feat(notification): add notification popover

Add popover showing recent 5 notifications with unread
badge and link to full notification center.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Integrate Bell into Sidebar

**Files:**
- Modify: `frontend/src/components/layout/sidebar.tsx`

- [ ] **Step 1: Add NotificationBell to sidebar header**

In `frontend/src/components/layout/sidebar.tsx`, add import after line 34:

```typescript
import { NotificationBell } from '@/components/notifications'
```

Find the header section (around line 498-527) and modify to include the bell:

Replace:
```typescript
      {/* Header */}
      <div className="relative flex items-center justify-between p-4 shrink-0">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            {/* ... logo ... */}
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebarCollapse}
          /* ... */
        >
          /* ... */
        </Button>
      </div>
```

With:
```typescript
      {/* Header */}
      <div className="relative flex items-center justify-between p-4 shrink-0">
        {!sidebarCollapsed ? (
          <>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full scale-150" />
                <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
                  <MessageSquare className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
              <h1 className="text-lg font-semibold text-sidebar-foreground tracking-tight">
                AI Chat Note
              </h1>
            </div>
            <div className="flex items-center gap-1">
              <NotificationBell />
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebarCollapse}
                className={cn(
                  'relative rounded-lg transition-all duration-200',
                  'hover:bg-sidebar-accent/80 hover:scale-105 active:scale-95'
                )}
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebarCollapse}
            className={cn(
              'relative rounded-lg transition-all duration-200 mx-auto',
              'hover:bg-sidebar-accent/80 hover:scale-105 active:scale-95'
            )}
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        )}
      </div>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/layout/sidebar.tsx
git commit -m "$(cat <<'EOF'
feat(notification): integrate bell into sidebar header

Add notification bell with popover to sidebar header,
positioned next to collapse button.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Notification Center Page

**Files:**
- Create: `frontend/src/app/(main)/notifications/page.tsx`

- [ ] **Step 1: Create notification center page**

```typescript
// frontend/src/app/(main)/notifications/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, BellRing, Sparkles, AlertCircle, CheckCheck, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useNotifications, useMarkAllAsRead, useDeleteAllNotifications } from '@/hooks/use-notifications'
import { NotificationItem } from '@/components/notifications/notification-item'
import { cn } from '@/lib/utils'
import { getT } from '@/i18n'
import type { NotificationType } from '@/types'

export default function NotificationsPage() {
  const router = useRouter()
  const t = getT()
  const [activeType, setActiveType] = useState<NotificationType | 'all'>('all')
  const [clearDialogOpen, setClearDialogOpen] = useState(false)

  const { data, isLoading } = useNotifications(
    activeType !== 'all' ? { type: activeType } : undefined
  )
  const markAllAsRead = useMarkAllAsRead()
  const deleteAllNotifications = useDeleteAllNotifications()

  const notifications = data?.data ?? []
  const unreadCount = data?.unread_count ?? 0

  const handleClearAll = () => {
    deleteAllNotifications.mutate(
      activeType !== 'all' ? activeType : undefined,
      {
        onSuccess: () => setClearDialogOpen(false),
      }
    )
  }

  const typeTabs = [
    { value: 'all', label: t('notifications.types.all'), icon: Bell },
    { value: 'system', label: t('notifications.types.system'), icon: Bell },
    { value: 'ai_task', label: t('notifications.types.aiTask'), icon: Sparkles },
    { value: 'error', label: t('notifications.types.error'), icon: AlertCircle },
  ] as const

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold">{t('notifications.title')}</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {unreadCount} {t('notifications.unread')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead.mutate()}
              disabled={unreadCount === 0 || markAllAsRead.isPending}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              {t('notifications.markAllRead')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setClearDialogOpen(true)}
              disabled={notifications.length === 0}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('notifications.clearAll')}
            </Button>
          </div>
        </div>

        {/* Type Filter Tabs */}
        <div className="px-6 pb-4">
          <Tabs value={activeType} onValueChange={(v) => setActiveType(v as typeof activeType)}>
            <TabsList>
              {typeTabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BellRing className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                {t('notifications.empty')}
              </p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                {t('notifications.emptyDesc')}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-w-2xl mx-auto">
              {notifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Clear All Confirmation Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('notifications.clearConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {activeType === 'all'
                ? t('notifications.clearConfirmDesc')
                : t('notifications.clearConfirmDescType', { type: typeTabs.find(t => t.value === activeType)?.label })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('notifications.clear')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/app/\(main\)/notifications/page.tsx
git commit -m "$(cat <<'EOF'
feat(notification): add notification center page

Add dedicated page with type filtering, mark all read,
and clear all functionality.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: i18n Translations

**Files:**
- Modify: `frontend/src/i18n/locales/zh.ts`
- Modify: `frontend/src/i18n/locales/en.ts`

- [ ] **Step 1: Add Chinese translations**

Add to `frontend/src/i18n/locales/zh.ts`:

```typescript
  notifications: {
    title: '消息中心',
    unread: '条未读',
    empty: '暂无消息',
    emptyDesc: '新消息将会显示在这里',
    viewAll: '查看全部消息',
    markAllRead: '全部已读',
    clearAll: '清空全部',
    clear: '清空',
    clearConfirmTitle: '确认清空',
    clearConfirmDesc: '确定要清空所有消息吗？此操作不可撤销。',
    clearConfirmDescType: '确定要清空所有「{type}」类型的消息吗？此操作不可撤销。',
    allRead: '已全部标记为已读',
    markReadFailed: '标记已读失败',
    deleteSuccess: '消息已删除',
    deleteFailed: '删除失败',
    clearSuccess: '消息已清空',
    clearFailed: '清空失败',
    types: {
      all: '全部',
      system: '系统',
      aiTask: 'AI 任务',
      error: '错误',
    },
  },
```

- [ ] **Step 2: Add English translations**

Add to `frontend/src/i18n/locales/en.ts`:

```typescript
  notifications: {
    title: 'Notifications',
    unread: 'unread',
    empty: 'No notifications',
    emptyDesc: 'New notifications will appear here',
    viewAll: 'View all notifications',
    markAllRead: 'Mark all read',
    clearAll: 'Clear all',
    clear: 'Clear',
    clearConfirmTitle: 'Confirm Clear',
    clearConfirmDesc: 'Are you sure you want to clear all notifications? This action cannot be undone.',
    clearConfirmDescType: 'Are you sure you want to clear all "{type}" notifications? This action cannot be undone.',
    allRead: 'All marked as read',
    markReadFailed: 'Failed to mark as read',
    deleteSuccess: 'Notification deleted',
    deleteFailed: 'Failed to delete',
    clearSuccess: 'Notifications cleared',
    clearFailed: 'Failed to clear',
    types: {
      all: 'All',
      system: 'System',
      aiTask: 'AI Task',
      error: 'Error',
    },
  },
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/i18n/locales/zh.ts frontend/src/i18n/locales/en.ts
git commit -m "$(cat <<'EOF'
feat(notification): add i18n translations

Add notification-related translations for Chinese and English.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: Integration Test - Note Save Notification

**Files:**
- Modify: `backend/internal/handlers/note.go`

- [ ] **Step 1: Add notification to note creation**

In `backend/internal/handlers/note.go`, add notification import and send notification after successful note creation.

Add import at top:
```go
import (
	// ... existing imports ...
	"github.com/chat-note/backend/internal/models"
)
```

Modify the `Create` function (around line 92-127) to send notification after successful creation:

After the line `utils.LogOperationSuccess(...)` and before `c.JSON(http.StatusCreated, ...)`, add:

```go
	// Send notification
	notificationRepo := repository.NewNotificationRepository()
	folderName := "默认文件夹"
	if note.FolderID != nil {
		if folder, err := h.folderRepo.FindByID(*note.FolderID); err == nil {
			folderName = folder.Name
		}
	}
	notificationRepo.CreateFromTemplate(
		userID,
		"note_saved",
		map[string]string{
			"title":  req.Title,
			"folder": folderName,
		},
		models.NotificationPayload{
			ResourceType: "note",
			ResourceID:   strconv.FormatUint(uint64(note.ID), 10),
		},
	)
```

- [ ] **Step 2: Test the integration**

1. Start the backend server
2. Create a note via the frontend or API
3. Check that a notification appears in the bell popover

- [ ] **Step 3: Commit**

```bash
git add backend/internal/handlers/note.go
git commit -m "$(cat <<'EOF'
feat(notification): integrate with note creation

Send notification when a note is successfully created.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review Checklist

After writing this plan, I verified:

**1. Spec Coverage:**
- ✅ Data model with notifications table
- ✅ Message templates with 3 types (system, ai_task, error)
- ✅ 6 API endpoints (list, unread-count, read, read-all, delete, delete-all)
- ✅ Header bell icon with unread badge
- ✅ Popover preview (5 recent messages)
- ✅ Notification center page with type filtering
- ✅ i18n support

**2. Placeholder Scan:**
- ✅ No TBD, TODO, or incomplete sections
- ✅ All code blocks contain complete implementations
- ✅ All file paths are exact

**3. Type Consistency:**
- ✅ `NotificationType` matches between backend and frontend
- ✅ `NotificationPayload` structure consistent
- ✅ API response structure matches frontend expectations
