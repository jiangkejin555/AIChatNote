# Design: Replace Frontend Mock API with Real Backend API

## Context

### 当前状态

前端 API 层架构：

```
frontend/src/lib/api/
├── client.ts        ← Axios 客户端，baseURL 配置正确
├── auth.ts          ← ✅ 已使用真实 API
├── providers.ts     ← 🔴 USE_MOCK=true
├── models.ts        ← ⚠️ 已废弃，无需处理
├── conversations.ts ← 🔴 USE_MOCK=true
├── notes.ts         ← 🔴 USE_MOCK=true
├── folders.ts       ← 🔴 USE_MOCK=true
├── tags.ts          ← 🔴 USE_MOCK=true
└── mock-data.ts     ← Mock 数据和 API 实现
```

### 后端 API 响应格式

```typescript
// 后端统一响应格式
{
  data: T | T[]           // 实际数据
  total?: number          // 分页总数
  page?: number           // 当前页
  page_size?: number      // 每页数量
}
```

### 关键差异点

| 问题 | 前端 Mock | 后端实际 | 需要适配 |
|------|-----------|----------|----------|
| 响应包装 | 直接返回数据 | `{ data: ... }` | ✅ |
| 字段命名 | camelCase | snake_case | ✅ |
| Tags 格式 | `string[]` | `NoteTag[]` | ✅ |
| 分页响应 | 无 | 有分页元数据 | ✅ |

## Goals / Non-Goals

**Goals:**
- 将所有前端 API 调用切换到真实后端
- 保持前端类型定义不变（通过适配层转换）
- 确保数据持久化和多端同步
- 保持 UI 层代码无需修改

**Non-Goals:**
- 不修改后端 API 格式
- 不修改 UI 组件代码
- 不实现新的 API 功能
- 不保留 mock 数据功能（可直接删除）

## Decisions

### Decision 1: 响应格式适配策略

**选择**: 在各 API 模块中就地处理响应格式

**方案对比**:
| 方案 | 优点 | 缺点 |
|------|------|------|
| A. 响应拦截器统一处理 | 集中管理 | 需要判断响应类型，复杂度高 |
| B. 各模块就地处理 | 简单直接，易于调试 | 代码略有重复 |
| C. 创建适配层函数 | 可复用 | 增加抽象层 |

**选择 B**，原因：
- 各 API 模块的响应格式不完全一致
- 就地处理更清晰，便于调试
- 代码重复量可控（每个模块几行代码）

### Decision 2: 字段命名转换策略

**选择**: 前端保持 camelCase，在 API 层做转换

**实现方式**:
```typescript
// 请求时: camelCase → snake_case
const requestData = {
  target_folder_id: data.targetFolderId,
  is_default: data.isDefault,
}

// 响应时: snake_case → camelCase (如需要)
const { is_predefined } = response.data
return { isPredefined: is_predefined }
```

**不使用**自动转换库，原因：
- 转换点较少，手动处理更可控
- 避免引入额外依赖
- 便于 code review

### Decision 3: Tags 格式转换

**选择**: 在 `notesApi` 中处理格式转换

```typescript
// 后端返回
interface NoteTag {
  note_id: number
  tag: string
  created_at: string
}

// 前端期望
type Tags = string[]

// 转换逻辑
const tags = note.tags.map((t: NoteTag) => t.tag)
```

### Decision 4: 分页响应处理

**选择**: 暂时忽略分页，使用完整数据

```typescript
// 后端分页响应
{
  data: Note[],
  total: 100,
  page: 1,
  page_size: 20
}

// 前端当前处理
return response.data.data  // 只取数据，暂不分页
```

**未来考虑**: 当数据量增大时，在前端实现分页 UI

### Decision 5: 流式响应处理

**选择**: 暂不处理，保持现有 mock 流式逻辑

当前 `conversations.ts` 的 `sendMessage` 和 `regenerate` 方法：
- 后端支持 SSE 流式响应
- 前端 mock 直接返回完整消息
- 本次变更先切换到非流式模式，后续单独实现流式

**实现**:
```typescript
// 临时方案：使用 stream=false
await apiClient.post(`/conversations/${id}/messages`, {
  content,
  stream: false  // 暂不使用流式
})
```

## Risks / Trade-offs

### Risk 1: 响应格式不一致导致运行时错误

**风险**: 后端实际响应与文档不一致
**缓解**:
- 先用浏览器开发者工具验证实际响应格式
- 添加 TypeScript 类型检查
- 逐模块切换，充分测试

### Risk 2: 流式聊天体验下降

**风险**: 暂不使用流式响应，用户等待时间变长
**缓解**:
- 显示加载状态
- 后续迭代实现流式响应
- 可考虑后端优化响应速度

### Risk 3: 数据迁移

**风险**: 用户已有的 mock 数据无法迁移到后端
**缓解**:
- Mock 数据仅存在于内存，刷新即丢失
- 正式环境本身无数据迁移问题
- 开发测试阶段可接受数据丢失

## Migration Plan

### Phase 1: 准备阶段
1. 验证后端 API 是否正常运行
2. 使用 Postman/curl 测试各 API 端点
3. 确认 API 响应格式

### Phase 2: 逐模块切换
按复杂度从低到高顺序：

1. **tags.ts** (最简单)
   - 仅一个 `getAll()` 方法
   - 验证流程正确性

2. **folders.ts**
   - 5 个方法
   - 响应格式统一

3. **providers.ts**
   - 7 个方法
   - 需要处理 `is_predefined` 字段

4. **notes.ts**
   - 12 个方法
   - 需要处理 tags 格式转换
   - 需要处理文件上传

5. **conversations.ts** (最复杂)
   - 9 个方法
   - 流式响应处理
   - 分页响应

### Phase 3: 清理
1. 删除 `mock-data.ts`
2. 移除 `USE_MOCK` 变量
3. 端到端测试

### 回滚策略

如发现问题，可立即回滚：
```typescript
// 将 USE_MOCK 改回 true
const USE_MOCK = true
```

## Open Questions

1. **流式响应何时实现？**
   - 建议: 作为后续独立迭代
   - 优先级: P2 (不影响核心功能)

2. **是否需要分页 UI？**
   - 建议: 当前数据量不大，暂不实现
   - 优先级: P3 (未来优化)

3. **错误处理策略？**
   - 当前: 依赖 axios 拦截器的 401 处理
   - 建议: 后续可添加 toast 提示
