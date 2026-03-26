## 1. 后端 - 数据模型与迁移

- [x] 1.1 创建 `internal/models/user_settings.go`，定义 UserSettings 模型
- [x] 1.2 创建 `internal/migrations/008_add_user_settings.sql`，新增 user_settings 表

## 2. 后端 - 配置支持

- [x] 2.1 更新 `config.yaml`，新增 context 配置节（default_mode, default_level, summary/simple 参数）
- [x] 2.2 创建配置结构体和加载逻辑，支持读取 context 配置

## 3. 后端 - Repository 层

- [x] 3.1 创建 `internal/repository/user_settings.go`，实现 UserSettingsRepository
- [x] 3.2 在 MessageRepository 中新增 `FindRecentByConversationID(convID, limit)` 方法，支持限制查询条数

## 4. 后端 - Service 层

- [x] 4.1 创建 `internal/services/context_config.go`，实现 ContextConfigService：
  - GetContextParams(mode, level) 返回对应参数
  - 参数映射逻辑（从配置读取或使用默认值）
- [x] 4.2 修改 `internal/services/summary.go`，将硬编码常量改为从配置获取

## 5. 后端 - Handler 层

- [x] 5.1 创建 `internal/handlers/user_settings.go`，实现：
  - GET /api/user/settings
  - PUT /api/user/settings
- [x] 5.2 注册路由
- [x] 5.3 修改 `internal/handlers/conversation.go` 的 SendMessage 方法：
  - 获取用户设置
  - 根据模式选择不同的消息查询策略
  - Simple 模式：调用 FindRecentByConversationID 限制查询
  - Summary 模式：按需查询（先查摘要，再查必要消息）

## 6. 前端 - API 层

- [x] 6.1 创建 `src/lib/api/user-settings.ts`，实现 getUserSettings 和 updateUserSettings
- [x] 6.2 创建 `src/hooks/use-user-settings.ts`，封装用户设置的获取和更新逻辑

## 7. 前端 - UI 组件

- [x] 7.1 修改 `src/app/(main)/settings/page.tsx`，新增"会话记忆设置"区域：
  - 上下文处理模式选择（智能摘要 / 直接传递）
  - 记忆长度选择（短期 / 普通 / 长期）
  - 模式说明弹窗组件

## 8. 前端 - 国际化

- [x] 8.1 更新 `src/i18n/locales/zh.json`，新增会话记忆设置相关文案
- [x] 8.2 更新 `src/i18n/locales/en.json`，新增会话记忆设置相关英文文案

## 9. 测试

- [ ] 9.1 为 UserSettingsRepository 编写单元测试
- [ ] 9.2 为 ContextConfigService 编写单元测试
- [ ] 9.3 为 UserSettingsHandler 编写 API 测试
- [ ] 9.4 验证消息查询优化效果（对比优化前后的查询条数）

## 10. 文档更新

- [ ] 10.1 更新 `backend/docs/conversation-summary.md`，补充可配置参数说明
- [ ] 10.2 新增配置说明文档，解释 context 配置节各参数含义
