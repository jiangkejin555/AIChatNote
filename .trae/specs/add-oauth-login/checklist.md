# OAuth 登录功能 Checklist

## 数据库与模型

- [ ] `oauth_accounts` 表已创建并包含所有必要字段
- [ ] `users` 表已添加 `nickname`、`avatar_url`、`email_verified` 字段
- [ ] `OAuthAccount` 模型已创建并通过单元测试
- [ ] `User` 模型已更新并通过单元测试

## 后端配置

- [ ] OAuth 配置结构已添加到 `config.go`
- [ ] 支持从环境变量加载 Google OAuth 配置
- [ ] 支持从环境变量加载 GitHub OAuth 配置
- [ ] 支持从环境变量加载 QQ OAuth 配置
- [ ] 配置验证逻辑已实现

## 后端服务层

- [ ] `OAuthService` 基础结构已创建
- [ ] Google OAuth 授权 URL 生成正确
- [ ] Google OAuth 回调处理正确
- [ ] GitHub OAuth 授权 URL 生成正确
- [ ] GitHub OAuth 回调处理正确
- [ ] QQ OAuth 授权 URL 生成正确
- [ ] QQ OAuth 回调处理正确
- [ ] State 参数生成逻辑正确（32 位随机字符串）
- [ ] State 参数验证逻辑正确（检查存在、删除已使用）
- [ ] State 参数存储在 Redis 中，有效期 10 分钟

## 后端仓库层

- [ ] `OAuthAccountRepository` 已创建
- [ ] `Create` 方法正确创建 OAuth 账号关联
- [ ] `FindByProviderAndUserID` 方法正确查询
- [ ] `FindByUserID` 方法正确查询用户所有关联账号
- [ ] `Delete` 方法正确删除关联
- [ ] 所有仓库方法已通过单元测试

## 后端 Handler

- [ ] `GetAuthURL` 接口返回正确的授权 URL
- [ ] `HandleCallback` 接口正确处理授权码
- [ ] `HandleCallback` 接口正确验证 State 参数
- [ ] `HandleCallback` 接口正确创建新用户
- [ ] `HandleCallback` 接口正确更新已存在用户
- [ ] `HandleCallback` 接口正确创建 OAuth 账号关联
- [ ] `HandleCallback` 接口返回正确的 JWT token
- [ ] `GetLinkedAccounts` 接口返回用户所有关联账号
- [ ] `UnlinkAccount` 接口正确检查是否为最后登录方式
- [ ] `UnlinkAccount` 接口正确删除关联
- [ ] `BindAccount` 接口正确生成授权 URL（已登录用户）
- [ ] `DeleteAccount` 接口正确验证用户身份（密码或 OAuth）
- [ ] `DeleteAccount` 接口正确删除所有用户关联数据
- [ ] `DeleteAccount` 接口使用事务确保数据一致性
- [ ] `DeleteAccount` 接口失败时正确回滚
- [ ] 所有 Handler 已通过单元测试

## 后端路由

- [ ] `GET /api/auth/oauth/:provider` 路由已注册
- [ ] `POST /api/auth/oauth/:provider/callback` 路由已注册
- [ ] `GET /api/auth/oauth/accounts` 路由已注册（需认证）
- [ ] `DELETE /api/auth/oauth/:provider` 路由已注册（需认证）
- [ ] `GET /api/auth/oauth/:provider/bind` 路由已注册（需认证）
- [ ] `DELETE /api/auth/account` 路由已注册（需认证）

## 前端 API 层

- [ ] `getOAuthURL` 方法已添加
- [ ] `handleOAuthCallback` 方法已添加
- [ ] `getLinkedAccounts` 方法已添加
- [ ] `unlinkOAuthAccount` 方法已添加
- [ ] `deleteAccount` 方法已添加
- [ ] TypeScript 类型定义已添加

## 前端回调页面

- [ ] `/auth/callback/[provider]` 页面已创建
- [ ] 页面正确提取 URL 中的 code 和 state 参数
- [ ] 页面正确调用后端回调接口
- [ ] 成功后正确存储 token 并跳转
- [ ] 失败后显示错误提示并提供重试选项
- [ ] 加载状态正确显示

## 前端登录页面

- [ ] OAuth 登录按钮组件已创建
- [ ] Google 登录按钮正确显示
- [ ] GitHub 登录按钮正确显示
- [ ] QQ 登录按钮正确显示
- [ ] 未配置的提供商按钮不显示
- [ ] "或"分隔符正确显示
- [ ] 点击按钮正确跳转到授权页面

## 前端注册页面

- [ ] OAuth 注册按钮已添加
- [ ] "使用 OAuth 快速注册"提示已添加
- [ ] 按钮功能与登录页面一致

## 前端账户注销页面

- [ ] 设置页面中添加"账户管理"部分
- [ ] "注销账户"按钮正确显示
- [ ] 账户注销确认对话框已创建
- [ ] 警告提示正确显示（数据删除说明）
- [ ] 确认复选框已添加
- [ ] 密码验证输入框正确显示（邮箱登录用户）
- [ ] OAuth 验证流程正确实现（OAuth 登录用户）
- [ ] 注销成功后正确跳转到登录页面
- [ ] 注销失败时显示错误提示
- [ ] 取消按钮正确关闭对话框

## 前端账号管理页面（可选）

- [ ] 设置页面中添加"账号关联"部分
- [ ] 已关联账号列表正确显示
- [ ] 每个账号显示提供商图标和名称
- [ ] 每个账号显示关联时间
- [ ] 解除关联按钮正确显示
- [ ] 解除关联功能正确实现
- [ ] 绑定新账号按钮正确显示
- [ ] 绑定新账号功能正确实现

## 国际化

- [ ] `zh.json` 中 OAuth 相关翻译已添加
- [ ] `en.json` 中 OAuth 相关翻译已添加
- [ ] 所有 OAuth 相关文本使用翻译键

## 安全性

- [ ] State 参数防 CSRF 攻击已实现
- [ ] State 参数只能使用一次
- [ ] State 参数有效期不超过 10 分钟
- [ ] Redirect URI 白名单验证已实现
- [ ] 生产环境强制 HTTPS
- [ ] Cookie 设置 Secure 和 HttpOnly 标志

## 测试

- [ ] OAuth 完整流程集成测试已通过
- [ ] 多提供商场景测试已通过
- [ ] 错误场景测试已通过
- [ ] State 参数过期测试已通过
- [ ] 账号关联/解除关联测试已通过
- [ ] 账户注销功能测试已通过
- [ ] 账户注销数据删除验证测试已通过（验证所有关联数据已删除）
- [ ] 账户注销事务回滚测试已通过（验证失败时数据不丢失）

## 文档

- [ ] `.env.example` 文件已更新 OAuth 配置示例
- [ ] OAuth 配置说明文档已编写
- [ ] API 文档已更新

## 部署验证

- [ ] 开发环境 OAuth 登录流程正常
- [ ] 生产环境 OAuth 登录流程正常
- [ ] 所有配置的提供商都能正常工作
- [ ] 错误日志正确记录
