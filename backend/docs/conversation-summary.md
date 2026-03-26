# 会话总结（Conversation Summary）技术文档

## 概述

会话总结功能用于解决长对话场景下 token 消耗随对话长度线性增长的问题。通过**滑动窗口 + 摘要压缩**策略，在保留对话语义连续性的同时控制 token 消耗。

### 问题背景

当前实现会将对话的**所有历史消息**发送给 LLM，导致：
- 增加用户成本（API 调用费用）
- 增加响应延迟
- 可能超出模型上下文窗口限制

### 解决方案

实现滑动窗口 + 摘要压缩策略：
- 超过窗口大小时，生成摘要并发送 `[摘要] + [最近消息]`
- 摘要采用增量更新策略：基于旧摘要 + 新消息合并压缩
- 对用户透明，无需前端改动

## 核心参数

| 参数 | 值 | 说明 |
|------|-----|------|
| `WindowAutoSize` | 20 | 超过 20 条消息触发摘要 |
| `KeepRecentCount` | 10 | 最近 10 条保持原样 |
| `SummaryUpdateFrequency` | 5 | 摘要之后每新增 5 条消息，更新摘要 |
| `SummaryMaxTokens` | 300 | 摘要生成的最大 token 数 |

## 架构设计

### 模块结构

```
backend/internal/
├── models/
│   └── conversation_summary.go    # 数据模型
├── repository/
│   └── summary.go                 # 数据访问层
├── services/
│   └── summary.go                 # 业务逻辑层
└── handlers/
    └── conversation.go            # HTTP 处理器（集成摘要功能）
```

### 数据模型

```go
type ConversationSummary struct {
    ID             uint      // 主键
    ConversationID uint      // 会话 ID（唯一索引）
    Summary        string    // 摘要内容
    EndMessageID   uint      // 摘要覆盖到的最后一条消息 ID
    CreatedAt      time.Time
    UpdatedAt      time.Time
}
```

**数据库表结构：**
```sql
CREATE TABLE conversation_summaries (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    end_message_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_conversation_summary UNIQUE (conversation_id)
);
```

## 详细流程

### 1. 消息发送主流程

```
用户发送消息
    │
    ▼
保存用户消息到数据库
    │
    ▼
获取会话所有历史消息
    │
    ▼
调用 buildContextMessages() 构建上下文
    │
    ├──────────────────────────────────────┐
    │                                      │
    ▼                                      ▼
消息数 ≤ 20?                        消息数 > 20
    │                                      │
    ▼                                      ▼
直接返回所有消息              检查是否需要生成/更新摘要
    │                                      │
    │                                      ├── 需要更新 ──▶ 生成/更新摘要
    │                                      │                    │
    │                                      │                    ▼
    │                                      │              保存摘要到数据库
    │                                      │                    │
    │                                      ▼                    ▼
    │                              构建 [摘要 + 最近消息] ◀──────┘
    │                                      │
    ▼                                      ▼
发送给 LLM ◀─────────────────────────────────┘
```

### 2. 构建上下文消息（buildContextMessages）

```go
func (h *ConversationHandler) buildContextMessages(
    ctx context.Context,
    conv *models.Conversation,
    messages []models.Message,
    client *openai.Client,
    model string,
) ([]openai.ChatCompletionMessage, bool, error)
```

**流程说明：**

1. **检查消息数量**
   - 如果总消息数 ≤ `WindowAutoSize`（20），直接返回所有消息

2. **获取现有摘要**
   - 从数据库查询该会话的摘要记录

3. **判断是否需要更新摘要**
   - 条件 1：摘要不存在（首次生成）
   - 条件 2：摘要后新增消息数 ≥ `SummaryUpdateFrequency`（5）

4. **生成/更新摘要**
   - **首次生成**：取前 `总消息数 - KeepRecentCount` 条消息生成摘要
   - **增量更新**：取旧摘要 + 摘要后的新消息，合并压缩

5. **构建最终消息列表**
   - 摘要作为 system message
   - 加上保留的原始消息

**返回值：**
- `chatMessages`：发送给 LLM 的消息列表
- `summaryWasUpdated`：本次是否更新了摘要
- `error`：错误信息

### 3. 摘要生成策略

#### 3.1 首次摘要生成

当消息数首次超过 20 条时：
```
Summary1 = 压缩(Message[0] ~ Message[9])
最终消息 = [摘要 Summary1] + [Message[10] ~ Message[19]]
```

#### 3.2 增量更新

每新增 5 条消息后：
```
Summary2 = 压缩(Summary1 + Message[20] ~ Message[24])
最终消息 = [摘要 Summary2] + [Message[25] ~ 最新消息]
```

#### 3.3 分组加权压缩

将参与摘要的消息分为三组，通过 Prompt 引导不同处理策略：

| 分组 | 范围 | 处理策略 |
|------|------|---------|
| 早期 | 前 1/3 | 轻度概括 |
| 中期 | 中 1/3 | 保留关键要点 |
| 近期 | 后 1/3 | 保留完整细节（代码、数据、结论） |

### 4. 摘要生成 Prompt

#### 首次摘要 Prompt

```
请将以下对话压缩为摘要。

权重说明：
- ★★★ 最新对话：请保留完整细节（代码、数据、结论）
- ★ 中期对话：保留关键要点
- 无标记：仅需概括大意

【早期对话 - 简要概括即可】
{早期消息}

【中期对话 - 保留关键要点】
{中期消息}

【近期对话 - 必须保留完整细节，包括代码】
{近期消息}

摘要（200-300字）：
```

#### 增量更新 Prompt

```
请合并以下内容，生成新的摘要。

【之前的摘要】
{旧摘要}

【新增对话 - 请保留更多细节】
{新消息}

要求：
1. 合并成连贯的摘要
2. 新增对话保留更多细节
3. 早期内容可以进一步精简
4. 总字数控制在 250 字以内

新摘要：
```

## 代码实现

### SummaryService

```go
// 判断是否需要生成/更新摘要
func (s *SummaryService) ShouldGenerateSummary(totalMessages int, summary *models.ConversationSummary) bool {
    if totalMessages <= WindowAutoSize {
        return false
    }
    if summary == nil {
        return true  // 首次生成
    }
    messagesSinceSummary := totalMessages - int(summary.EndMessageID)
    return messagesSinceSummary >= SummaryUpdateFrequency
}

// 生成摘要
func (s *SummaryService) GenerateSummary(
    ctx context.Context,
    messages []models.Message,
    oldSummary *models.ConversationSummary,
    client *openai.Client,
    model string,
) (string, error) {
    var prompt string
    if oldSummary != nil {
        prompt = s.buildIncrementalSummaryPrompt(oldSummary.Summary, messages)
    } else {
        prompt = s.buildSummaryPrompt(messages)
    }

    resp, err := client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
        Model:       model,
        Messages:    []openai.ChatCompletionMessage{{Role: "user", Content: prompt}},
        MaxTokens:   SummaryMaxTokens,
        Temperature: 0.3,
    })
    // ...
}
```

### SummaryRepository

```go
// Upsert - 创建或更新摘要
func (r *SummaryRepository) Upsert(summary *models.ConversationSummary) error {
    return database.DB.Transaction(func(tx *gorm.DB) error {
        var existing models.ConversationSummary
        err := tx.Where("conversation_id = ?", summary.ConversationID).First(&existing).Error

        if errors.Is(err, gorm.ErrRecordNotFound) {
            return tx.Create(summary).Error  // 创建新摘要
        }

        existing.Summary = summary.Summary
        existing.EndMessageID = summary.EndMessageID
        return tx.Save(&existing).Error  // 更新现有摘要
    })
}
```

## 降级策略

当摘要生成失败时，系统会自动降级：

```go
if buildErr != nil {
    utils.LogOperationError("ConversationHandler", "SendMessage", buildErr, "step", "build_context_messages")
    // Fallback: 使用所有消息，跳过摘要
    chatMessages = h.messagesToChatMessages(messages)
}
```

**降级场景：**
- LLM API 调用失败
- 摘要生成返回空结果
- 数据库保存失败

## 性能与成本分析

### Token 节省估算

以 30 条消息的对话为例：

| 方案 | Token 消耗 |
|------|-----------|
| 全量历史 | ~6000 tokens |
| 摘要 + 窗口 | ~3800 tokens |
| **节省** | **~37%** |

### 摘要生成成本

- 首次摘要：约 500 tokens 输入 + 300 tokens 输出
- 增量更新：约 500 tokens 输入 + 300 tokens 输出

**回本点**：用户发送 3-4 条消息后开始节省 token。

## 时序图

```
┌──────┐     ┌──────────┐     ┌───────────────┐     ┌──────────┐     ┌─────┐
│Client│     │Handler   │     │SummaryService │     │SummaryRepo│    │ LLM │
└──┬───┘     └────┬─────┘     └──────┬────────┘     └────┬─────┘     └──┬──┘
   │              │                  │                   │              │
   │ POST /message│                  │                   │              │
   │─────────────>│                  │                   │              │
   │              │ GetSummary()     │                   │              │
   │              │─────────────────>│                   │              │
   │              │                  │ FindByConvID()    │              │
   │              │                  │──────────────────>│              │
   │              │                  │<──────────────────│              │
   │              │<─────────────────│                   │              │
   │              │                  │                   │              │
   │              │ ShouldGenerate?  │                   │              │
   │              │─────────────────>│                   │              │
   │              │<─────────────────│                   │              │
   │              │                  │                   │              │
   │              │ GenerateSummary()│                   │              │
   │              │──────────────────────────────────────────────────────>│
   │              │                  │                   │              │
   │              │<─────────────────────────────────────────────────────│
   │              │                  │                   │              │
   │              │ SaveSummary()    │                   │              │
   │              │─────────────────>│                   │              │
   │              │                  │ Upsert()          │              │
   │              │                  │──────────────────>│              │
   │              │                  │<──────────────────│              │
   │              │<─────────────────│                   │              │
   │              │                  │                   │              │
   │              │ CreateChatCompletion (with summary + recent msgs)   │
   │              │──────────────────────────────────────────────────────>│
   │              │<─────────────────────────────────────────────────────│
   │              │                  │                   │              │
   │<─────────────│                  │                   │              │
```

## 关键文件索引

| 文件 | 说明 |
|------|------|
| [models/conversation_summary.go](../internal/models/conversation_summary.go) | 数据模型定义 |
| [repository/summary.go](../internal/repository/summary.go) | 数据访问层 |
| [services/summary.go](../internal/services/summary.go) | 业务逻辑层 |
| [handlers/conversation.go](../internal/handlers/conversation.go) | HTTP 处理器 |
| [migrations/007_add_conversation_summaries.sql](../migrations/007_add_conversation_summaries.sql) | 数据库迁移 |

## 注意事项

1. **同步模式**：摘要生成采用同步方式，用户请求会阻塞直到摘要生成完成（约 1-2 秒）

2. **模型选择**：使用会话当前关联的模型生成摘要，保持一致性

3. **Mock 模式**：测试环境下返回固定 Mock 摘要，不调用真实 LLM

4. **数据一致性**：每个会话只保留一个摘要（unique 约束），增量更新覆盖旧摘要

5. **降级保护**：摘要生成失败时自动降级为全量历史模式，不影响用户体验
