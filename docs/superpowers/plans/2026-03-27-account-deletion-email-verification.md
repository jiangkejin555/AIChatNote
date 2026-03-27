# 账号注销邮箱验证码功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将账号注销功能从密码验证改为邮箱验证码验证，统一所有用户的注销流程。

**Architecture:** 前端添加验证码发送和输入功能，后端修改删除账号接口接收验证码参数并调用现有的验证码服务进行校验。

**Tech Stack:** Go (Gin), React (Next.js), TypeScript, i18n

---

## File Structure

| 文件 | 操作 | 说明 |
|------|------|------|
| `backend/internal/handlers/auth.go` | 修改 | 修改 DeleteAccount handler |
| `frontend/src/lib/api/auth.ts` | 修改 | 修改 DeleteAccountRequest 接口 |
| `frontend/messages/zh.json` | 修改 | 添加中文翻译 |
| `frontend/messages/en.json` | 修改 | 添加英文翻译 |
| `frontend/src/components/auth/delete-account-dialog.tsx` | 修改 | 重写组件逻辑 |
| `frontend/src/components/auth/account-management-dialog.tsx` | 修改 | 移除 isOAuthUser prop |

---

### Task 1: 修改后端 DeleteAccount handler

**Files:**
- Modify: `backend/internal/handlers/auth.go:299-460`

- [ ] **Step 1: 修改 DeleteAccountRequest 结构体**

将 `DeleteAccountRequest` 从 `password` 改为 `code`：

```go
type DeleteAccountRequest struct {
	Code string `json:"code" binding:"required,len=6"`
}
```

位置：第 299-301 行

- [ ] **Step 2: 修改 DeleteAccount handler 逻辑**

修改 `DeleteAccount` 函数（第 421-460 行）：

```go
func (h *AuthHandler) DeleteAccount(c *gin.Context) {
	var req DeleteAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	userID := middleware.GetUserID(c)
	currentEmail := middleware.GetEmail(c)

	if !h.verificationCodeSvc.VerifyCode(currentEmail, req.Code) {
		utils.LogAuthEvent("delete_account", false, "userID", userID, "reason", "invalid_code")
		utils.SendError(c, http.StatusUnauthorized, "invalid_code", "Invalid or expired verification code")
		return
	}

	user, err := h.userRepo.FindByID(userID)
	if err != nil {
		utils.LogOperationError("AuthHandler", "DeleteAccount", err, "userID", userID, "step", "find_user")
		utils.SendErrorWithErr(c, http.StatusNotFound, "user_not_found", "User not found", err)
		return
	}

	if err := h.accountDeletionRepo.DeleteAllUserData(userID); err != nil {
		utils.LogOperationError("AuthHandler", "DeleteAccount", err, "userID", userID, "step", "delete_user_data")
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "delete_error", "Failed to delete account", err)
		return
	}

	utils.LogAuthEvent("delete_account", true, "userID", userID, "email", user.Email)
	c.JSON(http.StatusOK, DeleteAccountResponse{
		Message: "Account deleted successfully",
	})
}
```

- [ ] **Step 3: 运行后端测试**

Run: `cd backend && go test ./internal/handlers/... -v`
Expected: 所有测试通过

- [ ] **Step 4: Commit**

```bash
git add backend/internal/handlers/auth.go
git commit -m "feat(auth): change account deletion to use email verification code

- Replace password verification with email verification code
- Unify deletion flow for both email and OAuth users"
```

---

### Task 2: 修改前端 API 接口

**Files:**
- Modify: `frontend/src/lib/api/auth.ts:31-33`

- [ ] **Step 1: 修改 DeleteAccountRequest 接口**

将 `password?: string` 改为 `code: string`：

```typescript
export interface DeleteAccountRequest {
  code: string
}
```

- [ ] **Step 2: 修改 deleteAccount 函数调用**

修改 `deleteAccount` 函数（第 87-90 行）：

```typescript
  deleteAccount: async (data: DeleteAccountRequest): Promise<DeleteAccountResponse> => {
    const response = await apiClient.delete<DeleteAccountResponse>('/auth/account', { data })
    return response.data
  },
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/api/auth.ts
git commit -m "feat(api): update DeleteAccountRequest to use verification code"
```

---

### Task 3: 添加国际化翻译

**Files:**
- Modify: `frontend/messages/zh.json`
- Modify: `frontend/messages/en.json`

- [ ] **Step 1: 添加中文翻译**

在 `auth.deleteAccount` 对象中添加新的翻译 key（约第 434 行后）：

```json
    "deleteAccount": {
      "title": "注销账户",
      "description": "此操作将永久删除您的账户和所有数据，且不可恢复",
      "warning": "删除的数据包括：会话记录、笔记、文件夹、模型配置等所有数据",
      "confirmLabel": "我已了解风险，确认注销账户",
      "confirmButton": "确认注销",
      "cancelButton": "取消",
      "sendCode": "发送验证码",
      "resendCode": "重新发送 ({count}s)",
      "codeLabel": "验证码",
      "codePlaceholder": "请输入6位验证码",
      "codeSent": "验证码已发送到您的邮箱",
      "success": "账户已注销",
      "failed": "注销失败，请稍后重试",
      "confirmDialogTitle": "确认注销账户"
    }
```

- [ ] **Step 2: 添加英文翻译**

在 `auth.deleteAccount` 对象中添加新的翻译 key（约第 436 行后）：

```json
    "deleteAccount": {
      "title": "Delete Account",
      "description": "This action will permanently delete your account and all data, and cannot be recovered",
      "warning": "Data to be deleted includes: conversation history, notes, folders, model configurations, and all other data",
      "confirmLabel": "I understand the risks and confirm account deletion",
      "confirmButton": "Confirm Deletion",
      "cancelButton": "Cancel",
      "sendCode": "Send Code",
      "resendCode": "Resend ({count}s)",
      "codeLabel": "Verification Code",
      "codePlaceholder": "Enter 6-digit code",
      "codeSent": "Verification code sent to your email",
      "success": "Account deleted successfully",
      "failed": "Deletion failed, please try again later",
      "confirmDialogTitle": "Confirm Account Deletion"
    }
```

- [ ] **Step 3: Commit**

```bash
git add frontend/messages/zh.json frontend/messages/en.json
git commit -m "feat(i18n): add translations for account deletion verification code"
```

---

### Task 4: 重写 DeleteAccountDialog 组件

**Files:**
- Modify: `frontend/src/components/auth/delete-account-dialog.tsx`

- [ ] **Step 1: 重写组件完整代码**

完整替换文件内容：

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AxiosError } from 'axios'
import { useAuthStore } from '@/stores'
import { authApi } from '@/lib/api/auth'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, AlertTriangle } from 'lucide-react'
import { useTranslations } from '@/i18n'

interface DeleteAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  email: string
}

export default function DeleteAccountDialog({
  open,
  onOpenChange,
  email,
}: DeleteAccountDialogProps) {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const router = useRouter()
  const { logout } = useAuthStore()
  const t = useTranslations()

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setCode('')
      setCountdown(0)
    }
  }, [open])

  const handleSendCode = useCallback(async () => {
    if (countdown > 0 || isSendingCode) return

    setIsSendingCode(true)
    try {
      await authApi.sendVerificationCode({ email })
      toast.success(t('auth.deleteAccount.codeSent'))
      setCountdown(60)
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      const message = axiosError.response?.data?.message || t('auth.deleteAccount.failed')
      toast.error(message)
    } finally {
      setIsSendingCode(false)
    }
  }, [email, countdown, isSendingCode, t])

  const handleDeleteAccount = async () => {
    if (!code.trim() || code.trim().length !== 6) {
      toast.error(t('auth.deleteAccount.codePlaceholder'))
      return
    }

    setIsLoading(true)
    try {
      await authApi.deleteAccount({ code: code.trim() })
      toast.success(t('auth.deleteAccount.success'))
      logout()
      onOpenChange(false)
      router.push('/login')
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>
      const message = axiosError.response?.data?.message || t('auth.deleteAccount.failed')
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setCode('')
    setCountdown(0)
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent size="default">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10">
            <AlertTriangle className="text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>{t('auth.deleteAccount.confirmDialogTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('auth.deleteAccount.description')}
          </AlertDialogDescription>
          <div className="space-y-3 text-left mt-2">
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p className="mb-2 font-medium text-foreground">{t('settings.deleteAccount')}</p>
              <ul className="space-y-1.5 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <span>{t('auth.deleteAccount.warning')}</span>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <label htmlFor="delete-email" className="text-sm font-medium text-foreground">
                {t('auth.deleteAccount.codeLabel')}
              </label>
              <div className="flex gap-2">
                <Input
                  id="delete-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={t('auth.deleteAccount.codePlaceholder')}
                  className="h-10 flex-1"
                  disabled={isLoading}
                  maxLength={6}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 shrink-0"
                  onClick={handleSendCode}
                  disabled={countdown > 0 || isSendingCode || isLoading}
                >
                  {isSendingCode ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : countdown > 0 ? (
                    t('auth.deleteAccount.resendCode', { count: String(countdown) })
                  ) : (
                    t('auth.deleteAccount.sendCode')
                  )}
                </Button>
              </div>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose} disabled={isLoading}>
            {t('auth.deleteAccount.cancelButton')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={isLoading || code.trim().length !== 6}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              t('auth.deleteAccount.confirmButton')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/auth/delete-account-dialog.tsx
git commit -m "feat(auth): rewrite DeleteAccountDialog with email verification code

- Replace password input with verification code input
- Add send code button with 60s countdown
- Remove isOAuthUser prop, unify all users flow"
```

---

### Task 5: 修改 AccountManagementDialog 组件

**Files:**
- Modify: `frontend/src/components/auth/account-management-dialog.tsx`

- [ ] **Step 1: 移除 isOAuthUser 变量并修改 DeleteAccountDialog 调用**

修改组件：
1. 删除第 44 行的 `isOAuthUser` 变量定义
2. 修改第 126-130 行的 `DeleteAccountDialog` 调用，移除 `isOAuthUser` prop，添加 `email` prop

删除这行：
```tsx
  const isOAuthUser = !user?.email || (user as { password_hash?: string })?.password_hash === '' || (user as { password_hash?: string })?.password_hash === undefined
```

修改 DeleteAccountDialog 调用（第 126-130 行）：
```tsx
      <DeleteAccountDialog
        open={showDeleteAccount}
        onOpenChange={setShowDeleteAccount}
        email={user?.email || ''}
      />
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/auth/account-management-dialog.tsx
git commit -m "feat(auth): update AccountManagementDialog to pass email to DeleteAccountDialog

- Remove isOAuthUser logic from account management
- Pass email prop for verification code sending"
```

---

### Task 6: 集成测试和最终提交

- [ ] **Step 1: 运行前端类型检查**

Run: `cd frontend && npm run type-check || npx tsc --noEmit`
Expected: 无类型错误

- [ ] **Step 2: 运行前端 lint 检查**

Run: `cd frontend && npm run lint`
Expected: 无 lint 错误

- [ ] **Step 3: 运行后端测试**

Run: `cd backend && go test ./...`
Expected: 所有测试通过

- [ ] **Step 4: 手动测试流程**

1. 启动后端服务
2. 启动前端服务
3. 登录账号
4. 进入账号管理页面
5. 点击"注销账号"
6. 点击"发送验证码"
7. 检查邮箱收到验证码
8. 输入验证码
9. 点击"确认注销"
10. 验证账号被删除并跳转到登录页

- [ ] **Step 5: Final Commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: resolve any issues found during integration testing"
```
