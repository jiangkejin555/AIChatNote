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

## 上下文处理模式

系统支持两种上下文处理模式，用户可在前端设置页面进行配置：

### 1. 摘要模式（Summary Mode）

滑动窗口 + 摘要压缩策略：
- 当消息数超过 `WindowAutoSize` 时触发摘要
- 保留最近 `KeepRecentCount` 条消息作为原始消息
- 摘要通过 LLM 生成，包含对话关键信息

### 2. 简单模式（Simple Mode）

直接传递最近 N 条消息：
- 不生成摘要，直接取最近 `HistoryLimit` 条消息
- 适用于短对话或不需要上下文连续性的场景
- 响应更快（无需摘要生成时间）

## 记忆等级

每种模式支持三个记忆等级，影响上下文长度：

| 等级 | 摘要模式参数 | 简单模式参数 |
|------|-------------|-------------|
| **短期记忆** | WindowAutoSize=10, KeepRecentCount=5 | HistoryLimit=5 |
| **普通记忆** | WindowAutoSize=20, KeepRecentCount=10 | HistoryLimit=10 |
| **长期记忆** | WindowAutoSize=40, KeepRecentCount=20 | HistoryLimit=15 |

### 参数说明

- **WindowAutoSize**: 触发摘要更新的阈值（新消息数 >= 此值时更新摘要）
- **KeepRecentCount**: 保留的最近消息数（必须发送给 LLM，不参与摘要）
- **HistoryLimit**: 简单模式下传递给 LLM 的消息数量

## 配置文件

在 `config.yaml` 中配置默认参数：

```yaml
context:
  # 默认模式: summary | simple
  default_mode: "simple"
  # 默认记忆等级: short | normal | long
  default_level: "normal"

  # 摘要模式参数
  summary:
    max_tokens: 300  # 摘要生成的最大 token 数
    short:
      window_auto_size: 10
      keep_recent_count: 5
    normal:
      window_auto_size: 20
      keep_recent_count: 10
    long:
      window_auto_size: 40
      keep_recent_count: 20

  # 简单模式参数
  simple:
    short:
      history_limit: 5
    normal:
      history_limit: 10
    long:
      history_limit: 15
```

## 用户设置

用户可在前端"设置"页面配置会话记忆设置：
- **上下文处理模式**: 选择摘要模式或简单模式
- **记忆等级**: 选择短期、普通或长期记忆

设置保存在 `user_settings` 表中，按用户级别存储。

### API 接口

**获取用户设置**
```
GET /api/user/settings
Response: {
  "data": {
    "context_mode": "summary",  // summary | simple
    "memory_level": "normal"    // short | normal | long
  }
}
```

**更新用户设置**
```
PUT /api/user/settings
Body: {
  "context_mode": "summary",
  "memory_level": "long"
}
Response: {
  "data": {
    "context_mode": "summary",
    "memory_level": "long"
  }
}
```

## 架构设计

### 模块结构

```
backend/internal/
├── models/
│   ├── conversation_summary.go    # 摘要数据模型
│   └── user_settings.go           # 用户设置模型
├── repository/
│   ├── summary.go                 # 摘要数据访问层
│   └── user_settings.go           # 用户设置数据访问层
├── services/
│   ├── summary.go                 # 摘要业务逻辑层
│   └── context_config.go          # 上下文配置服务
└── handlers/
    ├── conversation.go            # HTTP 处理器（集成摘要功能）
    └── user_settings.go           # 用户设置 HTTP 处理器
```

### 数据模型

#### ConversationSummary

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

#### UserSettings

```go
type UserSettings struct {
    ID          uint         // 主键
    UserID      uint         // 用户 ID（唯一索引）
    ContextMode ContextMode  // summary | simple
    MemoryLevel MemoryLevel  // short | normal | long
    CreatedAt   time.Time
    UpdatedAt   time.Time
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

CREATE TABLE user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    context_mode VARCHAR(20) DEFAULT 'simple',
    memory_level VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_user_settings UNIQUE (user_id)
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
获取用户设置（context_mode, memory_level）
    │
    ├── 简单模式 ──────────────────────────────────┐
    │                                              │
    │   查询最近 HistoryLimit 条消息               │
    │                                              │
    ▼                                              ▼
摘要模式                                    直接发送给 LLM
    │
    ▼
获取现有摘要（如果有）
    │
    ▼
查询 [摘要EndID+1, 当前消息ID] 范围内的消息
    │
    ▼
判断新消息数量是否 >= WindowAutoSize?
    │
    ├── 否 ─────────────────────────────────────────┐
    │                                                │
    ▼                                                │
是：需要更新摘要                                  直接发送 [摘要 + 新消息]
    │                                                │
    ▼                                                │
生成新摘要 [旧摘要 + 前(N-KeepRecentCount)条]
    │
    ▼
保存摘要到数据库（更新 EndID）
    │
    ▼
发送 [新摘要 + 最近 KeepRecentCount 条消息]
    │
    ▼
发送给 LLM ◀─────────────────────────────────────────┘
```

### 2. 摘要模式核心算法

**核心思想**：基于摘要的 EndMessageID 动态计算需要获取的消息，避免摘要与新消息的重叠。

**参数说明**：
- `WindowAutoSize`：触发摘要更新的阈值（新消息数 >= 此值时更新）
- `KeepRecentCount`：必须保留的最近消息数（不参与摘要）

**算法流程**：

```go
func buildContextMessagesWithSummary(convID, currentMsgID, params) {
    // 1. 获取现有摘要
    summary := getSummary(convID)
    summaryEndID := 0
    if summary != nil {
        summaryEndID = summary.EndMessageID
    }

    // 2. 查询摘要之后的所有新消息
    // 如果没有摘要（summaryEndID=0），则查询所有消息
    messages := repo.FindByIDRange(convID, summaryEndID+1, currentMsgID)

    // 3. 判断是否需要更新摘要
    if len(messages) >= params.WindowAutoSize {
        // 需要更新摘要
        // 保留最近 KeepRecentCount 条消息不参与摘要
        keepFrom := len(messages) - params.KeepRecentCount

        // 用 [旧摘要 + 前 keepFrom 条消息] 生成新摘要
        messagesToSummarize := messages[:keepFrom]
        newSummary := generateSummary(summary, messagesToSummarize)

        // 保存新摘要，EndID 更新为 keepFrom-1 位置的消息ID
        saveSummary(newSummary, EndID=messages[keepFrom-1].ID)

        // 返回：[新摘要] + [最近 KeepRecentCount 条消息]
        return [newSummary] + messages[keepFrom:]
    } else {
        // 不需要更新摘要
        // 如果没有摘要：直接返回所有消息（消息数 < WindowAutoSize，无需摘要）
        // 如果有摘要：返回 [摘要] + [所有新消息]
        if summary == nil {
            return messages  // 直接返回所有消息
        }
        return [summary] + messages
    }
}
```

### 3. 算法示例

**参数**：WindowAutoSize=6, KeepRecentCount=3

#### 场景0：没有摘要，消息数不足（首次对话）

```
当前消息ID=4，没有摘要

新消息：[1, 2, 3, 4]，共 4 条
4 < 6，不触发摘要

发送给 LLM：[1, 2, 3, 4]（直接返回所有消息）
```

#### 场景1：没有摘要，消息数达到阈值（首次生成摘要）

```
当前消息ID=6，没有摘要

新消息：[1, 2, 3, 4, 5, 6]，共 6 条
6 >= 6，触发首次摘要

保留最近 3 条：[4, 5, 6]
参与摘要：[1, 2, 3]

生成新摘要：压缩 [1, 2, 3]，EndID=3

发送给 LLM：[摘要(1-3)] + [4, 5, 6]
```

#### 场景2：有摘要，不更新

```
当前消息ID=10，摘要 EndID=6

新消息：[7, 8, 9, 10]，共 4 条
4 < 6，不触发更新

发送给 LLM：[摘要(1-6)] + [7, 8, 9, 10]
```

#### 场景3：有摘要，需要更新

```
当前消息ID=12，摘要 EndID=6

新消息：[7, 8, 9, 10, 11, 12]，共 6 条
6 >= 6，触发更新

保留最近 3 条：[10, 11, 12]
参与摘要：[7, 8, 9]

生成新摘要：[旧摘要(1-6)] + [7, 8, 9] → 新摘要(1-9)，EndID=9

发送给 LLM：[新摘要(1-9)] + [10, 11, 12]
```

### 4. 算法特点

| 特点 | 说明 |
|------|------|
| ✅ 无冗余 | 摘要和新消息不重叠，不会重复发送 |
| ✅ 保证最近消息 | 最近 KeepRecentCount 条消息一定发送给 LLM |
| ✅ 信息完整 | 所有消息要么在摘要中，要么作为原始消息发送 |
| ⚠️ 消息数波动 | 不更新时，发送的消息数会从 1 增长到 WindowAutoSize-1 |

### 5. 摘要生成策略

#### 5.1 首次摘要生成

当消息数首次达到 WindowAutoSize 时：
```
新消息数量 = WindowAutoSize
触发条件：len(messages) >= WindowAutoSize

Summary1 = 压缩(Message[0] ~ Message[WindowAutoSize - KeepRecentCount - 1])
EndID = Message[WindowAutoSize - KeepRecentCount - 1].ID

最终消息 = [摘要 Summary1] + [最近 KeepRecentCount 条消息]
```

#### 5.2 增量更新

当新消息数量再次达到 WindowAutoSize 时：
```
新消息数量 >= WindowAutoSize

Summary2 = 压缩(Summary1 + 新消息中参与摘要的部分)
EndID = 更新为最新摘要位置的消息ID

最终消息 = [新摘要] + [最近 KeepRecentCount 条消息]
```

#### 5.3 分组加权压缩

将参与摘要的消息分为三组，通过 Prompt 引导不同处理策略：

| 分组 | 范围 | 处理策略 |
|------|------|---------|
| 早期 | 前 1/3 | 轻度概括 |
| 中期 | 中 1/3 | 保留关键要点 |
| 近期 | 后 1/3 | 保留完整细节（代码、数据、结论） |

### 6. 摘要生成 Prompt

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

### ContextConfigService

```go
// 获取上下文参数
func (s *ContextConfigService) GetContextParams(mode models.ContextMode, level models.MemoryLevel) *ContextParams {
    params := &ContextParams{
        Mode:             mode,
        MemoryLevel:      level,
        SummaryMaxTokens: s.config.Context.Summary.MaxTokens,
    }

    switch mode {
    case models.ContextModeSummary:
        // 返回摘要模式参数
        summaryParams := s.config.Context.Summary[level]
        params.WindowAutoSize = summaryParams.WindowAutoSize
        params.KeepRecentCount = summaryParams.KeepRecentCount
    case models.ContextModeSimple:
        // 返回简单模式参数
        params.HistoryLimit = s.config.Context.Simple[level].HistoryLimit
    }

    return params
}
```

### 构建上下文消息（buildContextMessagesWithSummary）

```go
func (h *ConversationHandler) buildContextMessagesWithSummary(
    ctx context.Context,
    conv *models.Conversation,
    params *services.ContextParams,
    client *openai.Client,
    model string,
) ([]openai.ChatCompletionMessage, bool, error) {
    // 1. 获取现有摘要
    summary, err := h.summaryService.GetSummary(conv.ID)
    if err != nil && !errors.Is(err, repository.ErrSummaryNotFound) {
        return nil, false, fmt.Errorf("failed to get summary: %w", err)
    }

    // 2. 确定查询起始点
    var summaryEndID uint
    if summary != nil {
        summaryEndID = summary.EndMessageID
    }

    // 3. 获取当前最新消息ID
    currentMsgID := h.msgRepo.GetLatestMessageID(conv.ID)

    // 4. 查询摘要之后的所有新消息
    messages, err := h.msgRepo.FindByIDRange(conv.ID, summaryEndID+1, currentMsgID)
    if err != nil {
        return nil, false, fmt.Errorf("failed to fetch messages: %w", err)
    }

    // 5. 判断是否需要更新摘要
    if len(messages) >= params.WindowAutoSize {
        // 需要更新摘要
        keepFrom := len(messages) - params.KeepRecentCount
        if keepFrom < 0 {
            keepFrom = 0
        }

        var messagesToSummarize []models.Message
        var newEndMessageID uint

        if keepFrom > 0 {
            messagesToSummarize = messages[:keepFrom]
            newEndMessageID = messages[keepFrom-1].ID
        }

        if len(messagesToSummarize) > 0 {
            // 生成新摘要
            summaryText, genErr := h.summaryService.GenerateSummary(
                ctx, messagesToSummarize, summary, client, model, params.SummaryMaxTokens,
            )
            if genErr != nil {
                // 降级：只使用最近消息
                recentMsgs := messages
                if len(messages) > params.KeepRecentCount {
                    recentMsgs = messages[len(messages)-params.KeepRecentCount:]
                }
                return h.messagesToChatMessages(recentMsgs), false, nil
            }

            // 保存摘要
            newSummary := &models.ConversationSummary{
                ConversationID: conv.ID,
                Summary:        summaryText,
                EndMessageID:   newEndMessageID,
            }
            h.summaryService.SaveSummary(newSummary)
            summary = newSummary
        }

        // 返回：[摘要] + [最近 KeepRecentCount 条消息]
        result := h.buildSummaryMessage(summary.Summary)
        result = append(result, h.messagesToChatMessages(messages[keepFrom:])...)
        return result, true, nil
    }

    // 不需要更新摘要
    // 返回：[摘要] + [所有新消息]
    var result []openai.ChatCompletionMessage
    if summary != nil {
        result = h.buildSummaryMessage(summary.Summary)
    }
    result = append(result, h.messagesToChatMessages(messages)...)
    return result, false, nil
}
```

**返回值：**
- `chatMessages`：发送给 LLM 的消息列表
- `summaryWasUpdated`：本次是否更新了摘要
- `error`：错误信息

### SummaryService

```go
// 生成摘要（支持首次生成和增量更新）
func (s *SummaryService) GenerateSummary(
    ctx context.Context,
    messages []models.Message,
    oldSummary *models.ConversationSummary,
    client *openai.Client,
    model string,
    maxTokens int,
) (string, error) {
    var prompt string
    if oldSummary != nil {
        // 增量更新：合并旧摘要和新消息
        prompt = s.buildIncrementalSummaryPrompt(oldSummary.Summary, messages)
    } else {
        // 首次生成：直接压缩消息
        prompt = s.buildSummaryPrompt(messages)
    }

    resp, err := client.CreateChatCompletion(ctx, openai.ChatCompletionRequest{
        Model:       model,
        Messages:    []openai.ChatCompletionMessage{{Role: "user", Content: prompt}},
        MaxTokens:   maxTokens,
        Temperature: 0.3,
    })
    // ...
}

// GetSummary 获取会话的现有摘要
func (s *SummaryService) GetSummary(conversationID uint) (*models.ConversationSummary, error) {
    return s.repo.FindByConversationID(conversationID)
}

// SaveSummary 保存或更新摘要
func (s *SummaryService) SaveSummary(summary *models.ConversationSummary) error {
    return s.repo.Upsert(summary)
}
```

### MessageRepository 新增方法

```go
// FindByIDRange 查询指定ID范围内的消息
func (r *MessageRepository) FindByIDRange(conversationID uint, startID uint, endID uint) ([]models.Message, error) {
    var messages []models.Message
    err := r.db.Where("conversation_id = ?", conversationID).
        Where("id > ? AND id <= ?", startID, endID).
        Order("id ASC").
        Find(&messages).Error
    return messages, err
}

// GetLatestMessageID 获取会话最新消息ID
func (r *MessageRepository) GetLatestMessageID(conversationID uint) (uint, error) {
    var msg models.Message
    err := r.db.Where("conversation_id = ?", conversationID).
        Order("id DESC").
        First(&msg).Error
    if err != nil {
        return 0, err
    }
    return msg.ID, nil
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

### 查询优化效果

| 模式 | 查询方式 | 查询数量 | 说明 |
|------|----------|----------|------|
| 简单模式 | `FindRecent(limit)` | HistoryLimit 条 | 固定数量 |
| 摘要模式 | `FindByIDRange(startID, endID)` | 摘要后新增的消息数 | 动态计算 |

**摘要模式查询优势**：
- 只查询摘要之后的新消息，避免重复查询
- 查询数量在 `1` 到 `WindowAutoSize-1` 之间波动
- 更新摘要后，查询数量重置为最小值

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
| [models/conversation_summary.go](../internal/models/conversation_summary.go) | 摘要数据模型定义 |
| [models/user_settings.go](../internal/models/user_settings.go) | 用户设置模型定义 |
| [repository/summary.go](../internal/repository/summary.go) | 摘要数据访问层 |
| [repository/user_settings.go](../internal/repository/user_settings.go) | 用户设置数据访问层 |
| [services/summary.go](../internal/services/summary.go) | 摘要业务逻辑层 |
| [services/context_config.go](../internal/services/context_config.go) | 上下文配置服务 |
| [handlers/conversation.go](../internal/handlers/conversation.go) | HTTP 处理器 |
| [handlers/user_settings.go](../internal/handlers/user_settings.go) | 用户设置 HTTP 处理器 |
| [migrations/007_add_conversation_summaries.sql](../migrations/007_add_conversation_summaries.sql) | 摘要表迁移 |
| [migrations/008_add_user_settings.sql](../migrations/008_add_user_settings.sql) | 用户设置表迁移 |

## 注意事项

1. **同步模式**：摘要生成采用同步方式，用户请求会阻塞直到摘要生成完成（约 1-2 秒）

2. **模型选择**：使用会话当前关联的模型生成摘要，保持一致性

3. **Mock 模式**：测试环境下返回固定 Mock 摘要，不调用真实 LLM

4. **数据一致性**：每个会话只保留一个摘要（unique 约束），增量更新覆盖旧摘要

5. **降级保护**：摘要生成失败时自动降级为全量历史模式，不影响用户体验

6. **用户设置持久化**：用户设置按用户级别存储，切换设备后设置保持一致

7. **默认值**：新用户默认使用简单模式 + 普通记忆等级
