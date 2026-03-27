# Spec: Conversation Search

会话全文搜索功能规范。

## ADDED Requirements

### Requirement: User can search conversations by keyword

用户可以通过关键词搜索自己的会话，搜索范围包括会话标题和消息内容。

#### Scenario: Search returns matching conversations
- **WHEN** 用户在搜索框输入关键词
- **THEN** 系统返回标题或内容包含该关键词的会话列表
- **AND** 结果按相关度排序

#### Scenario: Search with no results
- **WHEN** 用户搜索的关键词没有任何匹配
- **THEN** 系统显示空结果列表
- **AND** 显示"无搜索结果"提示

#### Scenario: Empty search query
- **WHEN** 用户清空搜索框
- **THEN** 系统显示完整会话列表（按日期分组）

### Requirement: Search results display matched snippet

搜索结果应显示匹配的内容片段，帮助用户了解匹配位置。

#### Scenario: Show content snippet when matched in content
- **WHEN** 搜索匹配到消息内容
- **THEN** 结果显示匹配的内容片段（snippet）
- **AND** 显示匹配位置标识为"内容"

#### Scenario: Show title when matched in title
- **WHEN** 搜索匹配到会话标题
- **THEN** 结果显示会话标题
- **AND** 显示匹配位置标识为"标题"

### Requirement: Search is real-time with debounce

搜索应在用户输入时实时触发，但有防抖延迟以避免过多请求。

#### Scenario: Debounced search on typing
- **WHEN** 用户连续输入字符
- **THEN** 系统等待 300ms 无新输入后才发起搜索请求
- **AND** 不会为每次按键都发起请求

#### Scenario: Immediate search on Enter
- **WHEN** 用户按下回车键
- **THEN** 系统立即发起搜索请求（跳过 debounce）

### Requirement: Search API returns structured results

后端搜索 API 应返回结构化的搜索结果。

#### Scenario: API returns search results
- **WHEN** 调用 `GET /api/conversations/search?q={keyword}`
- **THEN** 返回匹配的会话列表
- **AND** 每个结果包含 id、title、snippet、matched_in、updated_at 字段

#### Scenario: API validates query parameter
- **WHEN** 调用搜索 API 但未提供 q 参数
- **THEN** 返回空结果列表（不报错）

#### Scenario: API enforces user data isolation
- **WHEN** 用户 A 搜索会话
- **THEN** 只返回用户 A 自己的会话
- **AND** 不会返回其他用户的会话

### Requirement: Search is case-insensitive

搜索应忽略大小写，提供更好的用户体验。

#### Scenario: Case-insensitive matching
- **WHEN** 用户搜索 "React"
- **THEN** 匹配 "react"、"REACT"、"React" 等各种大小写形式

### Requirement: Search UI is collapsible in sidebar

搜索框应在侧边栏会话历史区域，支持展开/收起。

#### Scenario: Toggle search input
- **WHEN** 用户点击搜索图标
- **THEN** 搜索输入框展开
- **WHEN** 用户再次点击搜索图标或清空搜索
- **THEN** 搜索输入框收起
