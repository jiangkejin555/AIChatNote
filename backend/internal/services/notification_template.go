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
	"welcome": {
		Code:         "welcome",
		Type:         MessageTypeSystem,
		Title:        "欢迎加入 ChatNote",
		Content:      "你好，{{username}}！非常高兴你成为我们的第 {{user_count}} 位用户。\n\n在这里，你可以：\n• 与 AI 对话，自动生成笔记\n• 管理和整理你的知识库\n• 使用多种 AI 模型\n\n如有任何问题，欢迎随时联系我们。祝你使用愉快！",
		ResourceType: "",
	},
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
