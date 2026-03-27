# 账号注销邮箱验证码功能设计

## 概述

将账号注销功能从密码验证改为邮箱验证码验证，统一所有用户（邮箱登录用户和 OAuth 用户）的注销流程。

## 当前实现

- **邮箱登录用户**：输入密码 → 确认 → 删除账号
- **OAuth 用户**：直接确认 → 删除账号

## 目标实现

- **所有用户**：发送验证码 → 输入验证码 → 确认 → 删除账号

## 用户流程

```
1. 用户在账号管理页面点击"注销账号"按钮
2. 弹出警告对话框，显示删除后果
3. 用户点击"发送验证码"按钮
4. 系统发送6位验证码到用户邮箱
5. 用户输入验证码
6. 用户点击"确认删除"
7. 后端验证码校验通过后删除所有用户数据
8. 前端自动登出并跳转到登录页
```

## 技术设计

### 前端改动

#### `frontend/src/components/auth/delete-account-dialog.tsx`

- 移除密码输入框
- 移除 `isOAuthUser` prop
- 添加"发送验证码"按钮（带60秒倒计时）
- 添加6位验证码输入框
- 调用 `authApi.sendVerificationCode()` 发送验证码

#### `frontend/src/components/auth/account-management-dialog.tsx`

- 移除 `isOAuthUser` 变量和相关逻辑
- `DeleteAccountDialog` 组件不再传递 `isOAuthUser` prop

#### `frontend/src/lib/api/auth.ts`

- 修改 `DeleteAccountRequest` 接口：`{ code: string }` 替换 `{ password?: string }`

### 后端改动

#### `backend/internal/handlers/auth.go`

修改 `DeleteAccount` handler：

```go
type DeleteAccountRequest struct {
    Code string `json:"code" binding:"required,len=6"`
}

func (h *AuthHandler) DeleteAccount(c *gin.Context) {
    // 1. 验证验证码
    // 2. 调用 accountDeletionRepo.DeleteAllUserData()
    // 3. 返回成功
}
```

### API 变更

| 接口 | 方法 | 原请求体 | 新请求体 |
|------|------|----------|----------|
| `/auth/account` | DELETE | `{ "password": "xxx" }` | `{ "code": "123456" }` |

### 国际化

需要添加新的翻译 key：
- `auth.deleteAccount.sendCode` - "发送验证码"
- `auth.deleteAccount.resendCode` - "重新发送 ({count}s)"
- `auth.deleteAccount.codeLabel` - "验证码"
- `auth.deleteAccount.codePlaceholder` - "请输入6位验证码"
- `auth.deleteAccount.codeSent` - "验证码已发送到您的邮箱"
