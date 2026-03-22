## Context

当前应用使用 Next.js 16 + React 19 + shadcn/ui + Zustand + next-themes。布局结构为：
- 全局 Sidebar（导航）
- 全局 Header（主题切换 + 用户菜单）
- 内容区域

用户希望优化布局，使账户信息更显眼、模型管理更易访问、设置页面更丰富，并增强"保存为笔记"功能。

## Goals / Non-Goals

**Goals:**
- 改善用户体验：账户信息更显眼、核心功能入口更清晰
- 丰富设置页面：主题和语言统一管理
- 增强"保存为笔记"：支持多对话、异步保存
- 支持 UI 国际化（中英文）

**Non-Goals:**
- 聊天内容国际化（聊天内容保持原样）
- 用户个人信息扩展（昵称、头像等）
- 后端 API 实现（先 mock）

## Decisions

### 1. Sidebar 底部用户区设计

**Decision**: 在 Sidebar 底部添加固定用户区域，包含头像、邮箱和下拉菜单

**Rationale**:
- 符合常见应用模式（Discord, Slack, VS Code）
- 视觉上更突出，不占用 Header 空间
- 下拉菜单包含"设置"和"退出登录"

**Structure**:
```
┌─────────────────────────┐
│ Sidebar Content         │
│ (flex-1, overflow)      │
│                         │
├─────────────────────────┤
│ [👤] user@...      [▶]  │  ← 固定底部
└─────────────────────────┘
```

### 2. 移除全局 Header

**Decision**: 从 `app/(main)/layout.tsx` 移除 `<Header />` 组件

**Rationale**:
- 简化布局结构
- 主题切换和用户菜单都移到其他位置
- 聊天页面的 ModelSelector 保持原位（页面内部顶部栏）

**Mobile Handling**:
- 移动端菜单按钮移到 Sidebar 内部顶部
- 或在聊天页面顶部保留一个简化的移动端 Header

### 3. 国际化方案

**Decision**: 使用 `next-intl` 实现 UI 国际化

**Rationale**:
- Next.js 官方推荐的 i18n 方案
- 支持 App Router
- 轻量级，易于集成

**Structure**:
```
/frontend
  /messages
    zh.json        # 中文翻译
    en.json        # 英文翻译
  /src
    /i18n
      config.ts    # i18n 配置
      request.ts   # next-intl request handler
```

**Implementation**:
- 使用 `next-intl/plugin` 集成到 Next.js
- 通过 `useTranslations` hook 获取翻译
- 语言偏好存储在 localStorage 或 cookie

### 4. 保存笔记浮动按钮

**Decision**: 在页面右下角添加浮动操作按钮（FAB）

**Rationale**:
- 显眼且不遮挡内容
- 始终可见，便于快速操作
- 符合 Material Design 的 FAB 模式

**Behavior**:
- 仅在聊天页面显示
- 点击后打开 SaveNoteDialog

### 5. 增强的 SaveNoteDialog

**Decision**: 重构对话框，支持多对话选择和保存方式

**New Fields**:
| 字段 | 类型 | 说明 |
|------|------|------|
| 对话范围 | Radio | 当前对话 / 选择对话 / 全部对话 |
| 保存方式 | Radio | AI 总结 / 直接保存 |
| 对话多选 | MultiSelect | 当选择"选择对话"时显示 |
| 文件夹 | Select | 已有 |
| 标签 | TagInput | 已有 |

**Async Flow**:
```
1. 用户点击"确认保存"
2. 对话框关闭，显示 toast: "正在后台保存..."
3. 后台调用 API（mock）
4. 完成后 toast: "✅ 笔记保存成功" 或 "❌ 保存失败"
```

### 6. Mock API 设计

**Decision**: 在 API 层 mock 批量保存和直接保存

**New API Methods**:
```typescript
// lib/api/notes.ts
notesApi.batchSave = async (data: BatchSaveRequest): Promise<void> => {
  // Mock: 延迟 2 秒后返回成功
  await new Promise(resolve => setTimeout(resolve, 2000))
  console.log('Mock: batch save', data)
}

notesApi.saveRaw = async (data: SaveRawRequest): Promise<void> => {
  // Mock: 延迟 1 秒后返回成功
  await new Promise(resolve => setTimeout(resolve, 1000))
  console.log('Mock: save raw', data)
}
```

## Risks / Trade-offs

### Risk: 国际化工作量
- **Risk**: 提取所有 UI 文案工作量大
- **Mitigation**: 优先处理核心页面（设置、导航、聊天），其他页面逐步迁移

### Risk: 移动端布局
- **Risk**: 移除 Header 后移动端可能需要额外处理
- **Mitigation**: 保留移动端简化 Header，或调整 Sidebar 为抽屉模式

### Risk: Mock API 与真实 API 差异
- **Risk**: Mock API 返回格式可能与后端最终实现不一致
- **Mitigation**: 定义清晰的接口类型，后端实现时遵循

## Migration Plan

1. **Phase 1**: Sidebar 改造 + Header 移除
2. **Phase 2**: 设置页面重构
3. **Phase 3**: 国际化集成
4. **Phase 4**: 保存笔记功能增强

可逐步发布，各阶段相对独立。

## Open Questions

- [ ] 移动端 Header 是否完全移除？还是保留简化版？
- [ ] 语言偏好是否需要持久化到后端用户配置？
