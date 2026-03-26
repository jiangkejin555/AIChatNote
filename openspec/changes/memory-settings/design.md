## Context

当前系统实现了滑动窗口+摘要压缩策略来控制 token 消耗，但存在以下问题：

1. **参数硬编码**：`WindowAutoSize=20`, `KeepRecentCount=10`, `SummaryUpdateFrequency=5` 等参数写死在代码中
2. **模式单一**：只支持摘要模式，用户无法选择更简单的直接传递模式
3. **查询低效**：`FindByConversationID` 每次查询所有历史消息，长对话时性能差
4. **无法个性化**：不同用户对记忆长度的需求不同，但系统无法适配

### 现有架构

```
SendMessage → FindByConversationID(全部消息) → buildContextMessages → LLM
                                                    ↓
                                              判断是否需要摘要
                                                    ↓
                                              [摘要] + [最近N条]
```

## Goals / Non-Goals

**Goals:**
- 支持两种上下文处理模式：智能摘要模式 和 直接传递模式
- 支持三级记忆等级：短期、普通、长期
- 参数通过 config.yaml 配置，支持运维调整
- 用户可在前端设置页面选择模式和等级
- 优化消息查询，按需获取而非全量查询
- 保留已有摘要数据，模式切换时不丢失

**Non-Goals:**
- 不支持会话级别的记忆设置（仅用户级别）
- 不实现异步摘要生成
- 不支持自定义参数值（用户只能选择预设等级）
- 不重建或删除已有摘要数据

## Decisions

### 1. 配置结构设计

在 `config.yaml` 中新增 `context` 配置节：

```yaml
context:
  default_mode: "simple"        # summary | simple
  default_level: "normal"       # short | normal | long

  summary:
    short:
      window_auto_size: 10
      keep_recent_count: 5
      summary_update_frequency: 3
    normal:
      window_auto_size: 20
      keep_recent_count: 10
      summary_update_frequency: 5
    long:
      window_auto_size: 40
      keep_recent_count: 20
      summary_update_frequency: 10
    max_tokens: 300

  simple:
    short:
      history_limit: 5
    normal:
      history_limit: 10
    long:
      history_limit: 15
```

**理由**：参数外置到配置文件，运维可根据实际情况调整，无需改代码重新部署。

### 2. 数据模型设计

新增 `user_settings` 表：

```sql
CREATE TABLE user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    context_mode VARCHAR(20) DEFAULT 'simple',  -- summary | simple
    memory_level VARCHAR(20) DEFAULT 'normal',  -- short | normal | long
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**理由**：用户级别设置，每用户一条记录，与用户生命周期一致。

### 3. 消息查询优化策略

```
Simple 模式：
  FindRecentByConversationID(convID, historyLimit)
  → 只查 N 条，直接使用

Summary 模式：
  1. 查询摘要 (conversation_summaries)
  2. 如果有摘要：
     FindRecentByConversationID(convID, keepRecent + updateFreq)
     → 只查摘要之后的消息
  3. 如果无摘要：
     FindRecentByConversationID(convID, windowAutoSize)
     → 查询足够判断是否需要摘要的消息量
```

**理由**：避免查询全部历史消息，大幅减少数据库 IO 和内存占用。

### 4. ContextConfigService 设计

```go
type ContextConfigService struct {
    config *Config  // 从 config.yaml 加载
}

type ContextParams struct {
    Mode                   string // summary | simple
    WindowAutoSize         int    // summary mode
    KeepRecentCount        int    // summary mode
    SummaryUpdateFrequency int    // summary mode
    HistoryLimit           int    // simple mode
    SummaryMaxTokens       int    // summary mode
}

func (s *ContextConfigService) GetParams(mode, level string) *ContextParams
```

**理由**：统一管理配置读取和参数映射，解耦配置与业务逻辑。

### 5. API 设计

```
GET  /api/user/settings      → 获取当前用户设置
PUT  /api/user/settings      → 更新当前用户设置
```

Request/Response:
```json
{
  "context_mode": "summary",
  "memory_level": "normal"
}
```

**理由**：RESTful 设计，简单直接，与现有 API 风格一致。

### 6. 前端 UI 设计

在设置页面新增"会话记忆设置"区域：
- 上下文处理模式：两个单选项，带信息弹窗说明
- 记忆长度：三个按钮组（短期/普通/长期）

**理由**：与现有设置页面风格一致，信息弹窗避免干扰主界面。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 用户不理解两种模式区别 | 提供清晰的说明弹窗，默认选择 simple 模式 |
| 配置参数设置不当影响体验 | 提供合理的默认值，文档说明各参数含义 |
| 模式切换时摘要数据不一致 | 保留摘要数据，切换回 summary 模式可继续使用 |
| 新增配置项增加部署复杂度 | 使用合理的默认值，配置可选 |
