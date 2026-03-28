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
// Note: note_saved, note_save_failed, model_config_error are handled by toast, not notifications
var Templates = map[string]Template{
	// AI Task notifications
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
