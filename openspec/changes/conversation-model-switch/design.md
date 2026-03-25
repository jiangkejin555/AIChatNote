## Context

当前系统架构：
- `Conversation` 表有 `provider_model_id` 字段，在创建对话时绑定，不可更改
- `Message` 表只存储 `role` 和 `content`，不记录消息来源模型
- 模型删除后，对话的 `provider_model_id` 变为 null，对话无法继续

用户需要在对话过程中灵活切换模型，同时保留完整的对话历史上下文。

## Goals / Non-Goals

**Goals:**
- 支持用户在已有对话中切换模型
- 每条 AI 消息记录并显示其来源模型
- 模型删除后用户可选择新模型继续对话
- 切换模型时需要用户确认

**Non-Goals:**
- 不改变消息发送的核心逻辑（每次请求仍会携带完整历史）
- 不支持批量修改历史消息的模型归属
- 不实现模型切换历史记录（只记录每条消息的模型）

## Decisions

### 1. 数据模型设计

**Decision**: Message 表新增 `provider_model_id`，Conversation 保留模型字段但语义改变

```
Conversation:
  - current_provider_model_id: 当前使用的模型（用于发送新消息时的默认选择）
  - 可为 null（极端情况：模型被删除且用户未选择新模型）

Message:
  - provider_model_id: 这条消息使用的模型（仅 assistant 消息有值）
  - user 消息此字段为 null
```

**Rationale**:
- 消息级别的模型归属是核心需求，用于显示和追溯
- Conversation 级别的"当前模型"用于 UI 显示和发送消息时的默认值
- 用户消息不需要记录模型（模型选择发生在用户发送之后）

### 2. 切换交互设计

**Decision**: 新对话直接选择，已有对话切换需确认

```
场景 A - 新对话：
  用户选择模型 → 直接生效 → 无需确认

场景 B - 已有对话：
  用户点击模型选择器 → 选择新模型 → 弹出确认框 → 确认后生效

场景 C - 模型被删除：
  显示提示 → 用户选择新模型 → 直接生效（无需确认，因为必须选择）
```

**Rationale**:
- 新对话没有历史，选择即生效符合用户预期
- 已有对话切换会影响后续上下文，需要用户明确知情
- 模型删除是异常状态，用户必须选择才能继续，无需额外确认

### 3. API 设计

**Decision**: 复用现有 API，通过参数控制行为

```
PUT /api/conversations/:id/model
  - body: { provider_model_id: string }
  - 更新对话的 current_provider_model_id
  - 前端在确认后才调用此 API
```

**Rationale**:
- 最小化 API 变更
- 确认逻辑在前端处理，后端只负责数据更新

## Risks / Trade-offs

### Risk 1: 数据迁移复杂度
**Risk**: 现有对话和消息需要迁移数据
**Mitigation**:
- 现有对话的 `provider_model_id` 迁移到 `current_provider_model_id`
- 现有消息的 `provider_model_id` 设为对应对话当时的模型（可通过 conversation_id 关联获取）

### Risk 2: 模型显示信息丢失
**Risk**: 如果模型被删除，消息的模型显示会变成 "未知模型"
**Mitigation**:
- 在 Message 表同时保存 `model_id` 快照（如 "gpt-4o"），即使 provider_model 被删除也能显示
- 参考 Conversation 已有的 model_id 快照机制

### Risk 3: 用户反复切换造成困惑
**Risk**: 用户可能不理解为什么同一对话中不同回复来自不同模型
**Mitigation**:
- 清晰的模型来源显示（OpenAI/GPT-4o 格式）
- 切换时的确认弹窗包含说明文字
