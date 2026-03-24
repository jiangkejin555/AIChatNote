# Spec: Frontend API Integration

定义前端与后端 API 集成的规范，包括响应格式处理、错误处理、类型适配等。

## ADDED Requirements

### Requirement: API Response Format Adaptation

前端 API 层 SHALL 正确处理后端统一响应格式 `{ data: ... }`。

#### Scenario: Single item response
- **WHEN** 后端返回 `{ data: { id: 1, name: "test" } }`
- **THEN** 前端 API 层返回 `{ id: 1, name: "test" }`

#### Scenario: List response
- **WHEN** 后端返回 `{ data: [{ id: 1 }, { id: 2 }] }`
- **THEN** 前端 API 层返回 `[{ id: 1 }, { id: 2 }]`

#### Scenario: Wrapped response with key
- **WHEN** 后端返回 `{ provider: { id: "uuid", name: "OpenAI" } }`
- **THEN** 前端 API 层返回 `{ id: "uuid", name: "OpenAI" }`

### Requirement: Field Name Conversion

前端 API 层 SHALL 处理 snake_case 与 camelCase 字段命名转换。

#### Scenario: Request parameter conversion
- **WHEN** 前端调用 `batchMoveNotes(ids, targetFolderId)`
- **THEN** 请求体包含 `target_folder_id` 字段

#### Scenario: Response field conversion for isPredefined
- **WHEN** 后端返回 `{ is_predefined: true }`
- **THEN** 前端 API 层返回 `{ isPredefined: true }`

### Requirement: Tags Format Conversion

前端 API 层 SHALL 正确转换 Note tags 格式。

#### Scenario: Backend tags to frontend format
- **WHEN** 后端返回 Note 包含 `tags: [{ note_id: 1, tag: "React" }, { note_id: 1, tag: "TypeScript" }]`
- **THEN** 前端 API 层返回 Note 包含 `tags: ["React", "TypeScript"]`

#### Scenario: Frontend tags to backend format
- **WHEN** 前端创建/更新 Note 包含 `tags: ["React"]`
- **THEN** 后端正确存储标签关联

### Requirement: Pagination Response Handling

前端 API 层 SHALL 正确处理后端分页响应格式。

#### Scenario: Extract data from paginated response
- **WHEN** 后端返回 `{ data: [...], total: 100, page: 1, page_size: 20 }`
- **THEN** 前端 API 层返回数据数组 `[...]`

#### Scenario: Ignore pagination metadata (current phase)
- **WHEN** 后端返回分页元数据
- **THEN** 前端暂时忽略 total/page/page_size 字段

### Requirement: Non-Streaming Chat Response

前端 API 层 SHALL 支持非流式聊天响应（过渡方案）。

#### Scenario: Send message with stream=false
- **WHEN** 用户发送聊天消息
- **THEN** 请求包含 `stream: false` 参数
- **AND** 前端等待完整响应返回

#### Scenario: Regenerate with stream=false
- **WHEN** 用户请求重新生成回复
- **THEN** 请求包含 `stream: false` 参数

### Requirement: API Error Handling

前端 API 层 SHALL 正确处理后端 API 错误。

#### Scenario: 401 Unauthorized
- **WHEN** 后端返回 401 错误
- **THEN** axios 拦截器自动触发 logout
- **AND** 重定向到登录页面

#### Scenario: 400 Bad Request
- **WHEN** 后端返回 400 错误
- **THEN** 前端 API 层抛出错误，包含错误信息

#### Scenario: Network error
- **WHEN** 网络请求失败
- **THEN** 前端 API 层抛出错误，包含错误信息

### Requirement: API Module Mock Toggle

前端 API 模块 SHALL 支持通过 `USE_MOCK` 常量切换 mock/real API。

#### Scenario: USE_MOCK = false
- **WHEN** `USE_MOCK` 设置为 `false`
- **THEN** 所有 API 调用发送到真实后端

#### Scenario: USE_MOCK = true (rollback)
- **WHEN** 需要回滚时将 `USE_MOCK` 设置为 `true`
- **THEN** 所有 API 调用使用 mock 数据
