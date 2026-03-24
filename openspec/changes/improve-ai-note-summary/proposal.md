## Why

当前 AI 笔记总结功能存在两个问题：
1. 使用 `config.yaml` 中硬编码的 DeepSeek 配置，而非用户当前会话选择的模型，导致用户体验不一致
2. AI 生成的 Markdown 内容直接存储为 HTML，导致展示时格式错乱

## What Changes

- **移除** `config.yaml` 中的 `llm` 配置项（deepseek_api_key, deepseek_api_base）
- **移除** `config.go` 中的 `NoteLLMConfig` 结构体
- **改造** `AIService` 使用会话关联的 `ProviderModel`（用户在聊天时选择的模型）
- **重写** 系统提示词，优化笔记总结质量（聚焦核心知识点）
- **修复** AI 保存时将 Markdown 转换为 HTML，与直接保存保持一致

## Capabilities

### New Capabilities

无新增能力

### Modified Capabilities

- `ai-note-summary`: 改为使用会话模型而非配置文件模型；优化系统提示词

## Impact

**后端改动：**
- `backend/internal/config/config.go` - 移除 NoteLLMConfig
- `backend/internal/services/ai.go` - 重构为使用会话模型
- `backend/config.yaml` - 移除 llm 配置

**前端改动：**
- `frontend/src/components/chat/save-note-dialog.tsx` - AI 保存时转换 Markdown → HTML
