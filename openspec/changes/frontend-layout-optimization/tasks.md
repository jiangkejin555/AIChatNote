## 1. Sidebar 改造

- [x] 1.1 在 Sidebar 底部添加用户区域组件（头像 + 邮箱 + 下拉菜单）
- [x] 1.2 用户下拉菜单包含"设置"和"退出登录"选项
- [x] 1.3 在导航中添加"模型管理"独立项，指向 `/settings/models`
- [x] 1.4 修改"设置"导航指向 `/settings`
- [x] 1.5 处理 Sidebar 投叠状态下底部用户区的显示

## 2. Header 移除

- [x] 2.1 从 `app/(main)/layout.tsx` 移除 `<Header />` 组件
- [x] 2.2 移动端：在 Sidebar 内部添加菜单切换按钮（或保留简化 Header）
- [x] 2.3 清理 Header 组件中不再需要的代码（主题切换、用户菜单）

## 3. 设置页面重构

- [x] 3.1 创建 `/settings` 路由页面 (`app/(main)/settings/page.tsx`)
- [x] 3.2 实现主题切换组件（浅色/深色/跟随系统）
- [x] 3.3 实现语言切换组件（中文/英文）
- [x] 3.4 添加设置页面的样式和布局

## 4. 国际化 (i18n)

- [x] 4.1 安装 `next-intl` 依赖
- [x] 4.2 创建 i18n 配置文件 (`src/i18n/config.ts`)
- [x] 4.3 创建中文翻译文件 (`messages/zh.json`)
- [x] 4.4 创建英文翻译文件 (`messages/en.json`)
- [x] 4.5 在 `providers.tsx` 中集成 `NextIntlClientProvider`
- [x] 4.6 提取 Sidebar 文案到翻译文件
- [x] 4.7 提取设置页面文案到翻译文件
- [x] 4.8 提取聊天页面 UI 文案到翻译文件
- [x] 4.9 实现语言切换的持久化（localStorage）

## 5. 保存笔记功能增强

- [x] 5.1 创建浮动按钮组件 (`components/chat/save-note-fab.tsx`)
- [x] 5.2 在聊天页面集成浮动按钮（仅聊天页显示）
- [x] 5.3 重构 `SaveNoteDialog`：
  - [x] 5.3.1 添加对话范围选择（当前/选择/全部）
  - [x] 5.3.2 添加保存方式选择（AI总结/直接保存）
  - [x] 5.3.3 添加多对话选择器（当选择"选择对话"时）
- [x] 5.4 实现 Mock API：
  - [x] 5.4.1 `notesApi.batchSave` - 批量保存笔记（mock）
  - [x] 5.4.2 `notesApi.saveRaw` - 直接保存原始对话（mock）
- [x] 5.5 实现异步保存流程：
  - [x] 5.5.1 点击确认后立即关闭对话框
  - [x] 5.5.2 显示"正在后台保存..." toast
  - [x] 5.5.3 保存完成后显示成功/失败 toast

## 6. 测试和清理

- [x] 6.1 测试 Sidebar 底部用户区功能
- [x] 6.2 测试移动端布局
- [x] 6.3 测试语言切换功能
- [x] 6.4 测试主题切换功能
- [x] 6.5 测试保存笔记完整流程
- [x] 6.6 清理未使用的代码和导入
