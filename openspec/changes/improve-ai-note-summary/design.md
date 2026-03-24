## Context

当前 AI 笔记总结功能的实现：

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              当前架构                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  config.yaml                     AIService                                  │
│  ┌─────────────────┐            ┌─────────────────┐                         │
│  │ llm:            │            │ - 使用固定的     │                         │
│  │   deepseek_*    │───────────▶│   deepseek API  │                         │
│  └─────────────────┘            │ - 硬编码模型名   │                         │
│                                 │   deepseek-chat │                         │
│  会话模型（未使用）              └─────────────────┘                         │
│  ┌─────────────────┐                        │                               │
│  │ Conversation    │                        ▼                               │
│  │   provider_     │            生成 Markdown 内容                           │
│  │   model_id      │                        │                               │
│  └─────────────────┘                        ▼                               │
│                                 直接存储到数据库                             │
│                                 (没有 Markdown→HTML 转换)                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Goals / Non-Goals

**Goals:**
- AI 总结使用会话关联的模型，与聊天体验一致
- 优化系统提示词，输出聚焦核心知识点
- 修复 Markdown 内容未转换为 HTML 的问题

**Non-Goals:**
- 不支持用户自定义系统提示词模板
- 不支持在总结时切换模型
- 如果会话关联的模型被删除，不提供 fallback（直接返回错误）

## Decisions

### 1. 模型选择策略

**决定：使用会话关联的 ProviderModel**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  GenerateNoteFromConversation(convID, userID)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. 获取 Conversation (包含 ProviderModelID)                                │
│  2. 如果 ProviderModelID 为空 → 返回错误                                     │
│  3. 获取 ProviderModel + Provider (包含 API Key)                            │
│  4. 如果 ProviderModel 或 Provider 被删除 → 返回错误                         │
│  5. 使用该 Provider 的 API Base + Key + Model 调用 AI                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**替代方案考虑：**
- ❌ 使用用户默认模型：与会话不一致，用户困惑
- ❌ 配置文件 fallback：增加维护成本，配置冗余

### 2. 系统提示词设计

**决定：使用精简的提示词，聚焦核心知识点**

```markdown
你是一个专业的知识整理助手，擅长从 AI 对话中提炼核心知识。

## 任务
将用户与 AI 的对话总结为结构化的学习笔记。

## 输出格式
你必须以 JSON 格式响应：
{
  "title": "简洁准确的标题（不超过50字）",
  "content": "Markdown 格式的笔记内容",
  "tags": ["1-3个相关标签"]
}

## content 内容结构

笔记内容应包含以下部分：

### 📌 核心知识点

梳理对话中讨论的主要内容，按主题组织：

- **概念与原理**：解释讨论的核心概念、工作原理
- **关键结论**：重要的结论、决策、最佳实践
- **代码示例**：保留必要的技术细节和代码片段

使用合理的层级结构（H3/H4 + 列表）组织内容，使其清晰易读。

## 注意事项
- 使用与对话相同的语言输出
- 聚焦有价值的知识，忽略寒暄和无关内容
- 保留足够的技术细节，不要过度精简
- 代码块必须标注语言类型
- 标题要能准确概括对话主题
- 标签应涵盖主要技术领域和关键概念
```

### 3. Markdown → HTML 转换

**决定：在前端 AI 保存时转换，复用 `markdownToHtml` 函数**

位置：`save-note-dialog.tsx` 的 `handleAiSummarySave`

```tsx
// 改动前
const result = await generateNote.mutateAsync({ conversation_id: conversationId })
await createNote.mutateAsync({
  content: result.content,  // 直接存储 Markdown
  ...
})

// 改动后
const result = await generateNote.mutateAsync({ conversation_id: conversationId })
const htmlContent = await markdownToHtml(result.content)  // 转换为 HTML
await createNote.mutateAsync({
  content: htmlContent,
  ...
})
```

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| 会话模型被删除导致无法总结 | 返回明确的错误信息，提示用户模型已不可用 |
| 不同模型的总结质量差异 | 提示词设计尽可能通用，适配主流模型 |
| API Key 解密失败 | 复用现有的解密逻辑，已有错误处理 |
