# Checklist

## 后端验证

- [x] 修改密码接口 `PUT /api/auth/password` 正常工作
  - [x] 验证码验证正确
  - [x] 新密码长度验证（至少8位）
  - [x] OAuth 用户返回正确错误提示
  - [x] 密码更新成功后返回正确响应

- [x] 注销账号接口 `DELETE /api/auth/account` 正常工作
  - [x] 邮箱登录用户需要密码验证
  - [x] 删除用户所有关联数据（事务处理）
  - [x] 删除失败时正确回滚
  - [x] 返回正确响应

- [x] 数据删除完整性验证
  - [x] users 表记录删除
  - [x] refresh_tokens 表记录删除
  - [x] oauth_accounts 表记录删除
  - [x] conversations 表记录删除
  - [x] messages 表记录删除（通过 conversation 级联）
  - [x] notes 表记录删除
  - [x] folders 表记录删除
  - [x] note_tags 表记录删除
  - [x] providers 表记录删除
  - [x] provider_models 表记录删除
  - [x] user_settings 表记录删除
  - [x] feedbacks 表记录删除
  - [x] satisfaction_ratings 表记录删除
  - [x] feature_requests 表记录删除
  - [x] message_requests 表记录删除
  - [x] conversation_summaries 表记录删除

## 前端验证

- [x] 头像下拉菜单显示正确选项
  - [x] 菜单顺序正确：账号管理、设置、帮助与反馈、关于
  - [x] 不包含"退出登录"选项
  - [x] 点击"账号管理"显示账号管理对话框

- [x] 账号管理对话框功能正常
  - [x] 显示用户邮箱信息
  - [x] 邮箱登录用户显示"修改密码"按钮
  - [x] OAuth 登录用户隐藏"修改密码"按钮
  - [x] "退出登录"按钮正常工作
  - [x] "注销账号"按钮在"退出登录"下方显示（红色样式）

- [x] 修改密码对话框功能正常
  - [x] 显示当前用户邮箱（只读）
  - [x] 验证码发送和倒计时正常工作
  - [x] 表单验证正常工作
  - [x] 密码强度提示显示
  - [x] 成功后显示提示并关闭对话框
  - [x] 失败时显示错误信息

- [x] 注销账号确认对话框功能正常
  - [x] 显示警告信息
  - [x] 显示数据删除列表
  - [x] 密码验证输入框正常工作
  - [x] 成功后跳转到登录页面
  - [x] 失败时显示错误信息

- [x] 国际化翻译完整
  - [x] 中文翻译完整
  - [x] 英文翻译完整
