# Tasks

## Phase 1: 后端基础设施

- [x] Task 1: 配置 SMTP 邮件服务
  - [x] SubTask 1.1: 在 `config.yaml` 中添加 SMTP 配置结构
  - [x] SubTask 1.2: 在 `config.go` 中添加 SMTP 配置加载逻辑
  - [x] SubTask 1.3: 添加环境变量覆盖支持

- [x] Task 2: 创建验证码管理服务
  - [x] SubTask 2.1: 创建 `VerificationCodeService` (`backend/internal/services/verification_code.go`)
  - [x] SubTask 2.2: 实现验证码生成方法（6位随机数字）
  - [x] SubTask 2.3: 实现验证码存储方法（内存存储，有效期10分钟）
  - [x] SubTask 2.4: 实现验证码验证方法
  - [x] SubTask 2.5: 编写单元测试

- [x] Task 3: 创建邮件发送服务
  - [x] SubTask 3.1: 创建 `EmailService` (`backend/internal/services/email.go`)
  - [x] SubTask 3.2: 实现 SMTP 邮件发送方法
  - [x] SubTask 3.3: 实现验证码邮件模板
  - [x] SubTask 3.4: 添加错误处理和日志记录
  - [x] SubTask 3.5: 编写单元测试（使用 mock）

- [x] Task 4: 扩展 Auth Handler
  - [x] SubTask 4.1: 添加 `SendVerificationCode` 接口
  - [x] SubTask 4.2: 添加 `VerifyCodeAndLogin` 接口
  - [x] SubTask 4.3: 实现邮箱格式验证
  - [x] SubTask 4.4: 实现发送频率限制（60秒内只能发送一次）
  - [x] SubTask 4.5: 编写单元测试

- [x] Task 5: 注册路由
  - [x] SubTask 5.1: 在 `main.go` 中注册验证码相关路由
  - [x] SubTask 5.2: 配置路由中间件

## Phase 2: 前端实现

- [x] Task 6: 更新前端 API 层
  - [x] SubTask 6.1: 在 `auth.ts` 中添加 `sendVerificationCode` 方法
  - [x] SubTask 6.2: 在 `auth.ts` 中添加 `verifyCodeAndLogin` 方法
  - [x] SubTask 6.3: 添加 TypeScript 类型定义

- [x] Task 7: 创建验证码登录表单组件
  - [x] SubTask 7.1: 创建 `VerificationCodeForm` 组件
  - [x] SubTask 7.2: 实现邮箱输入框
  - [x] SubTask 7.3: 实现验证码输入框（6位数字）
  - [x] SubTask 7.4: 实现发送验证码按钮（带倒计时）
  - [x] SubTask 7.5: 实现表单验证

- [x] Task 8: 更新登录页面
  - [x] SubTask 8.1: 添加 Tab 切换（邮箱密码登录 / 验证码登录）
  - [x] SubTask 8.2: 集成验证码登录表单
  - [x] SubTask 8.3: 添加错误提示
  - [x] SubTask 8.4: 添加成功提示

## Phase 3: 国际化

- [x] Task 9: 添加国际化翻译
  - [x] SubTask 9.1: 在 `zh.json` 中添加验证码登录相关翻译
  - [x] SubTask 9.2: 在 `en.json` 中添加验证码登录相关翻译

## Phase 4: 测试与文档

- [x] Task 10: 编写集成测试
  - [x] SubTask 10.1: 测试验证码发送流程
  - [x] SubTask 10.2: 测试验证码验证流程
  - [x] SubTask 10.3: 测试验证码过期场景
  - [x] SubTask 10.4: 测试错误场景

- [x] Task 11: 更新配置文档
  - [x] SubTask 11.1: 更新 `.env.example` 文件
  - [x] SubTask 11.2: 更新 `config.yaml.example` 文件
  - [x] SubTask 11.3: 编写配置说明文档

# Task Dependencies

- Task 2-3 依赖 Task 1（需要 SMTP 配置）
- Task 4 依赖 Task 2-3（需要验证码和邮件服务）
- Task 5 依赖 Task 4（需要 Handler）
- Task 6-8 依赖 Task 5（需要后端接口）
- Task 9 可与 Task 6-8 并行
- Task 10 依赖 Task 1-9（所有功能完成后测试）
- Task 11 可与 Task 10 并行

# 建议实施顺序

## Week 1: 后端核心
1. **Day 1**: Task 1-2（SMTP 配置和验证码服务）
2. **Day 2**: Task 3-4（邮件服务和 Handler）
3. **Day 3**: Task 5（路由注册）

## Week 2: 前端与测试
1. **Day 1**: Task 6-7（API 层和组件）
2. **Day 2**: Task 8-9（登录页面和国际化）
3. **Day 3**: Task 10-11（测试和文档）

# 优先级说明

## P0 - 必须完成（MVP）
- Task 1-5: 后端核心功能
- Task 6-8: 前端登录功能
- Task 9: 国际化
- Task 11: 配置文档

## P1 - 推荐完成
- Task 10: 集成测试

## P2 - 可选
- 邮件模板美化
- 验证码发送日志优化
- 异常登录检测
