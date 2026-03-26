# Tasks

## Phase 1: 数据库与模型层

- [ ] Task 1: 创建数据库迁移文件
  - [ ] SubTask 1.1: 创建 `oauth_accounts` 表迁移文件
  - [ ] SubTask 1.2: 为 `users` 表添加 `nickname`、`avatar_url`、`email_verified` 字段
  - [ ] SubTask 1.3: 运行数据库迁移

- [ ] Task 2: 创建 OAuth 相关模型
  - [ ] SubTask 2.1: 创建 `OAuthAccount` 模型 (`backend/internal/models/oauth_account.go`)
  - [ ] SubTask 2.2: 更新 `User` 模型，添加新字段
  - [ ] SubTask 2.3: 编写模型单元测试

## Phase 2: 后端核心功能

- [ ] Task 3: 创建 OAuth 配置管理
  - [ ] SubTask 3.1: 在 `config.go` 中添加 OAuth 配置结构
  - [ ] SubTask 3.2: 添加环境变量加载逻辑
  - [ ] SubTask 3.3: 添加配置验证逻辑

- [ ] Task 4: 创建 OAuth 服务层
  - [ ] SubTask 4.1: 创建 `OAuthService` 基础结构 (`backend/internal/services/oauth.go`)
  - [ ] SubTask 4.2: 实现 Google OAuth 集成
  - [ ] SubTask 4.3: 实现 GitHub OAuth 集成
  - [ ] SubTask 4.4: 实现 QQ OAuth 集成
  - [ ] SubTask 4.5: 实现 State 参数生成与验证
  - [ ] SubTask 4.6: 编写服务层单元测试

- [ ] Task 5: 创建 OAuth 仓库层
  - [ ] SubTask 5.1: 创建 `OAuthAccountRepository` (`backend/internal/repository/oauth_account.go`)
  - [ ] SubTask 5.2: 实现 `Create`、`FindByProviderAndUserID`、`FindByUserID`、`Delete` 方法
  - [ ] SubTask 5.3: 编写仓库层单元测试

- [ ] Task 6: 创建 OAuth Handler
  - [ ] SubTask 6.1: 创建 `OAuthHandler` (`backend/internal/handlers/oauth.go`)
  - [ ] SubTask 6.2: 实现 `GetAuthURL` 接口 - 获取授权 URL
  - [ ] SubTask 6.3: 实现 `HandleCallback` 接口 - 处理 OAuth 回调
  - [ ] SubTask 6.4: 实现 `GetLinkedAccounts` 接口 - 获取已关联账号
  - [ ] SubTask 6.5: 实现 `UnlinkAccount` 接口 - 解除账号关联
  - [ ] SubTask 6.6: 实现 `BindAccount` 接口 - 绑定新账号
  - [ ] SubTask 6.7: 编写 Handler 单元测试

- [ ] Task 7: 创建账户注销功能
  - [ ] SubTask 7.1: 在 `UserRepository` 中添加 `DeleteUser` 方法（级联删除所有关联数据）
  - [ ] SubTask 7.2: 在 `AuthHandler` 中实现 `DeleteAccount` 接口
  - [ ] SubTask 7.3: 实现密码验证逻辑（邮箱登录用户）
  - [ ] SubTask 7.4: 实现 OAuth 验证逻辑（OAuth 登录用户）
  - [ ] SubTask 7.5: 实现事务处理，确保数据一致性
  - [ ] SubTask 7.6: 编写注销功能单元测试

- [ ] Task 8: 注册 OAuth 路由
  - [ ] SubTask 8.1: 在 `main.go` 中注册 OAuth 相关路由
  - [ ] SubTask 8.2: 配置路由中间件（部分接口需要认证）
  - [ ] SubTask 8.3: 注册账户注销路由

## Phase 3: 前端实现

- [ ] Task 9: 更新前端 API 层
  - [ ] SubTask 9.1: 在 `auth.ts` 中添加 OAuth API 方法
  - [ ] SubTask 9.2: 添加账户注销 API 方法
  - [ ] SubTask 9.3: 添加 TypeScript 类型定义

- [ ] Task 10: 创建 OAuth 回调页面
  - [ ] SubTask 10.1: 创建 `/auth/callback/[provider]/page.tsx`
  - [ ] SubTask 10.2: 实现回调处理逻辑（提取 code、state，调用后端）
  - [ ] SubTask 10.3: 添加错误处理和重试逻辑

- [ ] Task 11: 改造登录页面
  - [ ] SubTask 11.1: 添加 OAuth 登录按钮组件
  - [ ] SubTask 11.2: 根据 OAuth 配置动态显示按钮
  - [ ] SubTask 11.3: 添加"或"分隔符
  - [ ] SubTask 11.4: 实现点击跳转逻辑

- [ ] Task 12: 改造注册页面
  - [ ] SubTask 12.1: 添加 OAuth 注册按钮
  - [ ] SubTask 12.2: 添加"使用 OAuth 快速注册"提示

- [ ] Task 13: 创建账户注销页面
  - [ ] SubTask 13.1: 在设置页面添加"账户管理"部分
  - [ ] SubTask 13.2: 创建账户注销确认对话框
  - [ ] SubTask 13.3: 实现密码验证输入框（邮箱登录用户）
  - [ ] SubTask 13.4: 实现 OAuth 验证流程（OAuth 登录用户）
  - [ ] SubTask 13.5: 实现注销成功后的跳转逻辑
  - [ ] SubTask 13.6: 添加警告提示和确认复选框

- [ ] Task 14: 创建 OAuth 账号管理页面（可选）
  - [ ] SubTask 14.1: 在设置页面添加"账号关联"部分
  - [ ] SubTask 14.2: 显示已关联的 OAuth 账号列表
  - [ ] SubTask 14.3: 实现解除关联功能
  - [ ] SubTask 14.4: 实现绑定新账号功能

## Phase 4: 国际化

- [ ] Task 15: 添加国际化翻译
  - [ ] SubTask 15.1: 在 `zh.json` 中添加 OAuth 相关翻译
  - [ ] SubTask 15.2: 在 `en.json` 中添加 OAuth 相关翻译
  - [ ] SubTask 15.3: 添加账户注销相关翻译

## Phase 5: 测试与文档

- [ ] Task 16: 编写集成测试
  - [ ] SubTask 16.1: 编写 OAuth 完整流程集成测试
  - [ ] SubTask 16.2: 测试多提供商场景
  - [ ] SubTask 16.3: 测试错误场景
  - [ ] SubTask 16.4: 测试账户注销功能（验证所有数据已删除）

- [ ] Task 17: 更新配置文档
  - [ ] SubTask 17.1: 更新 `.env.example` 文件
  - [ ] SubTask 17.2: 编写 OAuth 配置说明文档
  - [ ] SubTask 17.3: 编写账户注销功能说明文档

# Task Dependencies

- Task 2 依赖 Task 1（需要数据库表结构）
- Task 4-6 依赖 Task 2-3（需要模型和配置）
- Task 7 依赖 Task 5（需要 UserRepository）
- Task 8 依赖 Task 6-7（需要 Handler）
- Task 9-14 依赖 Task 8（需要后端接口）
- Task 15 可与 Task 9-14 并行
- Task 16 依赖 Task 1-15（所有功能完成后测试）
- Task 17 可与 Task 16 并行

# 建议实施顺序

## Week 1: 后端核心
1. **Day 1-2**: Task 1-2（数据库与模型）
2. **Day 3-4**: Task 3-5（配置、服务、仓库）
3. **Day 5**: Task 6-7（Handler 与路由）

## Week 2: 前端与测试
1. **Day 1-2**: Task 8-9（API 与回调页面）
2. **Day 3**: Task 10-11（登录注册页面改造）
3. **Day 4**: Task 12-13（账号管理与国际化）
4. **Day 5**: Task 14-15（测试与文档）

# 优先级说明

## P0 - 必须完成（MVP）
- Task 1-8: 后端核心功能（包括账户注销）
- Task 9-12: 前端登录注册
- Task 13: 账户注销页面
- Task 15: 国际化
- Task 17: 配置文档

## P1 - 推荐完成
- Task 14: OAuth 账号管理页面
- Task 16: 集成测试

## P2 - 可选
- QQ OAuth 集成（如主要面向国际用户，可延后）
