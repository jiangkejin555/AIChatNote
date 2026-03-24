## 1. 基础设施

- [x] 1.1 创建 `internal/utils/logger.go`，实现日志工具函数
- [x] 1.2 实现 `maskAPIKey(key string) string` API Key 脱敏函数
- [x] 1.3 实现 `maskToken(token string) string` Token 脱敏函数
- [x] 1.4 实现 `LogOperationStart(module, operation string, fields ...interface{})` 函数
- [x] 1.5 实现 `LogOperationSuccess(module, operation string, fields ...interface{})` 函数
- [x] 1.6 实现 `LogOperationError(module, operation string, err error, fields ...interface{})` 函数
- [x] 1.7 实现 `LogLatency(module, operation string, latency time.Duration, fields ...interface{})` 函数

## 2. 认证中间件日志

- [x] 2.1 在 `internal/middleware/auth.go` 添加 Token 验证成功日志
- [x] 2.2 在 `internal/middleware/auth.go` 添加 Token 验证失败日志（包含失败原因）
- [x] 2.3 在 `internal/middleware/auth.go` 添加缺失 Authorization header 日志

## 3. Auth Handler 日志

- [x] 3.1 在 `Register` 方法添加注册成功日志
- [x] 3.2 在 `Register` 方法添加邮箱已存在日志
- [x] 3.3 在 `Register` 方法添加密码哈希失败日志
- [x] 3.4 在 `Login` 方法添加登录成功日志（包含 userID, email）
- [x] 3.5 在 `Login` 方法添加登录失败日志（包含原因）
- [x] 3.6 在 `Refresh` 方法添加 Token 刷新日志
- [x] 3.7 在 `Logout` 方法添加登出日志
- [x] 3.8 在 `GetCurrentUser` 方法添加获取用户信息日志

## 4. Conversation Handler 日志

- [x] 4.1 在 `Create` 方法添加创建对话日志
- [x] 4.2 在 `SendMessage` 方法添加发送消息开始日志
- [x] 4.3 在 `handleStreamResponse` 添加流式响应开始日志
- [x] 4.4 在 `handleStreamResponse` 添加流式响应完成日志（包含耗时）
- [x] 4.5 在 `handleNonStreamResponse` 添加非流式响应日志（包含耗时）
- [x] 4.6 在 AI 调用处添加 provider/model/latency 日志
- [x] 4.7 在 `Regenerate` 方法添加重新生成日志
- [x] 4.8 在 `Delete` 方法添加删除对话日志
- [x] 4.9 添加 AI API 调用失败日志
- [x] 4.10 添加慢响应警告日志（>5s）

## 5. Provider Handler 日志

- [x] 5.1 在 `Create` 方法添加创建 Provider 日志（类型、名称）
- [x] 5.2 在 `Update` 方法添加更新 Provider 日志
- [x] 5.3 在 `Delete` 方法添加删除 Provider 日志
- [x] 5.4 在 `TestConnection` 方法添加连接测试日志（包含延迟）
- [x] 5.5 在 `GetAvailableModels` 方法添加获取模型列表日志
- [x] 5.6 在 API Key 加密/解密失败处添加日志

## 6. Note Handler 日志

- [x] 6.1 在 `Create` 方法补充成功日志
- [x] 6.2 在 `Update` 方法补充成功日志
- [x] 6.3 在 `Delete` 方法添加删除日志
- [x] 6.4 在 `Import` 方法添加导入日志（文件名、成功/失败）
- [x] 6.5 在 `Export` 和 `ExportBatch` 方法添加导出日志
- [x] 6.6 在 `BatchDelete` 方法添加批量删除日志
- [x] 6.7 在 `BatchMove` 方法添加批量移动日志
- [x] 6.8 在 `Copy` 方法补充成功日志
- [x] 6.9 在 `Generate` 方法添加 AI 生成日志（包含耗时）

## 7. AI Service 日志

- [x] 7.1 在 `GenerateNoteFromConversation` 添加生成开始日志
- [x] 7.2 在 `GenerateNoteFromConversation` 添加生成完成日志（包含耗时）
- [x] 7.3 在 AI API 调用失败处添加详细错误日志

## 8. Folder Handler 日志

- [x] 8.1 在 `Create` 方法添加创建文件夹日志
- [x] 8.2 在 `Update` 方法添加更新文件夹日志
- [x] 8.3 在 `Delete` 方法添加删除文件夹日志
- [x] 8.4 在 `Copy` 方法添加复制文件夹日志

## 9. 测试与验证

- [x] 9.1 编译验证通过（go build 成功）
- [x] 9.2 代码审查完成 - 所有日志添加正确
- [x] 9.3 日志工具函数已添加到 utils/logger.go
- [x] 9.4 敏感信息脱敏函数已实现（MaskAPIKey, MaskToken, MaskEmail）
- [x] 9.5 日志格式一致性验证通过
