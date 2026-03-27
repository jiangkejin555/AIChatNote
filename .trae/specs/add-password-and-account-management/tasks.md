# Tasks

## 后端任务

- [x] Task 1: 后端 - 添加修改密码接口（使用验证码）
  - [x] Task 1.1: 在 `backend/internal/repository/user.go` 添加 `UpdatePassword` 方法
  - [x] Task 1.2: 在 `backend/internal/handlers/auth.go` 添加 `ChangePassword` 处理函数
  - [x] Task 1.3: 添加请求结构体 `ChangePasswordRequest`（包含 email, code, new_password）
  - [x] Task 1.4: 复用现有验证码验证逻辑
  - [x] Task 1.5: 在路由中注册 `PUT /api/auth/password` 接口

- [x] Task 2: 后端 - 添加注销账号接口
  - [x] Task 2.1: 在 `backend/internal/repository/user.go` 添加 `DeleteUser` 方法（事务删除）
  - [x] Task 2.2: 创建 `backend/internal/repository/account_deletion.go` 处理级联删除逻辑
  - [x] Task 2.3: 在 `backend/internal/handlers/auth.go` 添加 `DeleteAccount` 处理函数
  - [x] Task 2.4: 添加请求结构体 `DeleteAccountRequest`
  - [x] Task 2.5: 在路由中注册 `DELETE /api/auth/account` 接口

## 前端任务

- [x] Task 3: 前端 - 添加 API 方法
  - [x] Task 3.1: 在 `frontend/src/lib/api/auth.ts` 添加 `changePassword` 方法
  - [x] Task 3.2: 在 `frontend/src/lib/api/auth.ts` 添加 `deleteAccount` 方法
  - [x] Task 3.3: 添加相关 TypeScript 类型定义

- [x] Task 4: 前端 - 修改 Sidebar 头像下拉菜单
  - [x] Task 4.1: 在 `frontend/src/components/layout/sidebar.tsx` 添加"账号管理"菜单项
  - [x] Task 4.2: 从下拉菜单中移除"退出登录"选项
  - [x] Task 4.3: 创建账号管理状态管理（对话框开关）
  - [x] Task 4.4: 调整菜单顺序：账号管理、设置、帮助与反馈、关于

- [x] Task 5: 前端 - 创建账号管理对话框组件
  - [x] Task 5.1: 创建 `frontend/src/components/auth/account-management-dialog.tsx`
  - [x] Task 5.2: 显示用户邮箱信息
  - [x] Task 5.3: 添加"修改密码"按钮（仅邮箱登录用户显示）
  - [x] Task 5.4: 添加"退出登录"按钮
  - [x] Task 5.5: 添加"注销账号"按钮（红色样式，在退出登录下方）

- [x] Task 6: 前端 - 创建修改密码对话框组件
  - [x] Task 6.1: 创建 `frontend/src/components/auth/change-password-dialog.tsx`
  - [x] Task 6.2: 显示当前用户邮箱（只读）
  - [x] Task 6.3: 添加验证码输入和发送按钮（复用现有验证码逻辑）
  - [x] Task 6.4: 添加新密码和确认密码输入框
  - [x] Task 6.5: 添加密码强度提示
  - [x] Task 6.6: 处理成功/失败状态

- [x] Task 7: 前端 - 创建注销账号确认对话框组件
  - [x] Task 7.1: 创建 `frontend/src/components/auth/delete-account-dialog.tsx`
  - [x] Task 7.2: 显示警告信息和数据删除列表
  - [x] Task 7.3: 添加密码验证输入框
  - [x] Task 7.4: 处理成功后跳转到登录页面

- [x] Task 8: 前端 - 添加国际化翻译
  - [x] Task 8.1: 在 `frontend/src/i18n/locales/zh.json` 添加翻译
  - [x] Task 8.2: 在 `frontend/src/i18n/locales/en.json` 添加翻译

# Task Dependencies

- Task 3 依赖 Task 1 和 Task 2（需要后端 API 先完成）
- Task 5、Task 6、Task 7 可以并行开发
- Task 4 依赖 Task 5（需要账号管理对话框组件）
- Task 8 可以与 Task 4、Task 5、Task 6、Task 7 并行开发
