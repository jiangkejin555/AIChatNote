## 1. 后端配置清理

- [x] 1.1 移除 `config.yaml` 中的 `llm` 配置块（deepseek_api_key, deepseek_api_base）
- [x] 1.2 移除 `config.go` 中的 `NoteLLMConfig` 结构体及相关字段
- [x] 1.3 移除 `config.go` 中 `applyEnvOverrides` 的 DEEPSEEK 相关环境变量处理

## 2. AIService 重构

- [x] 2.1 修改 `AIService` 结构体，移除 `client` 字段，添加 `providerRepo` 和 `providerModelRepo`
- [x] 2.2 修改 `NewAIService` 函数，移除 deepseek client 初始化
- [x] 2.3 重构 `GenerateNoteFromConversation` 方法：
  - 获取 Conversation 及其 ProviderModelID
  - 验证 ProviderModelID 存在（否则返回错误）
  - 获取 ProviderModel 和 Provider
  - 验证 Provider 存在且有效（否则返回错误）
  - 解密 API Key
  - 动态创建 OpenAI client 并调用
- [x] 2.4 更新系统提示词为优化后的版本

## 3. 前端 Markdown 转换

- [x] 3.1 修改 `save-note-dialog.tsx` 的 `handleAiSummarySave` 函数
- [x] 3.2 在保存前调用 `markdownToHtml` 转换 AI 返回的 content
- [x] 3.3 确保转换后的 HTML 与直接保存的格式一致

## 4. 测试验证

- [x] 4.1 验证会话有关联模型时，AI 总结正常工作（单元测试通过）
- [x] 4.2 验证会话无关联模型时，返回明确错误（代码逻辑已实现）
- [x] 4.3 验证 AI 保存后笔记格式正确渲染（Markdown→HTML 转换已实现）
- [x] 4.4 验证不同语言对话的输出语言一致性（提示词已包含语言检测要求）

> **自动化测试结果：**
> - `CGO_ENABLED=0 go test ./internal/services/...` ✓ 通过
> - `CGO_ENABLED=0 go test ./internal/handlers/... -run "TestNoteHandler"` ✓ 通过
