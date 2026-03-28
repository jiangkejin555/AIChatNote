# 异步笔记生成功能设计

## 背景

当前 AI 笔记生成功能存在以下问题：
1. **超时问题**：前端 axios 超时设置为 30 秒，但 AI 生成可能需要更长时间（30+ 秒）
2. **用户体验差**：生成过程中无反馈，用户不知道进度
3. **资源浪费**：前端断开后，后端 AI 调用仍继续执行（使用了 `context.Background()`）

## 目标

1. 解决超时问题 - API 立即返回，后台异步生成
2. 提供生成状态反馈 - 显示"AI笔记生成中..."提示
3. 支持页面刷新恢复 - 用户刷新后可继续查看生成状态
4. 避免资源浪费 - 合理管理生成任务

## 方案概述

采用**异步任务 + 轮询**方案：
- 用户触发生成后，后端立即返回 task_id
- 后端异步执行 AI 生成，状态存入数据库
- 前端轮询任务状态，完成后自动保存笔记

不使用 SSE 流式返回，保持实现简单。

## 架构设计

```
┌─────────────┐     POST /notes/generate      ┌─────────────┐
│   前端      │ ──────────────────────────────▶│   后端      │
│             │     返回 task_id               │             │
│             │                                │             │
│  显示Toast  │     GET /notes/tasks/:id       │  创建任务   │
│  开始轮询   │ ◀──────────────────────────────▶│  状态存DB   │
│             │     返回 {status, note?}        │             │
│             │                                │             │
│             │                                │  异步调用AI │
│             │                                │      ↓      │
│             │                                │  更新DB状态 │
│             │                                │  创建笔记   │
│             │                                │             │
└─────────────┘                                └─────────────┘
```

## 数据库设计

### 新增表 `note_generation_tasks`

```sql
CREATE TABLE note_generation_tasks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    conversation_id BIGINT UNSIGNED NOT NULL,
    status ENUM('generating', 'done', 'failed') NOT NULL DEFAULT 'generating',
    error_message TEXT,
    note_id BIGINT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_conversation (user_id, conversation_id),
    INDEX idx_status (status)
);
```

**字段说明**：
- `user_id`: 用户ID
- `conversation_id`: 来源对话ID
- `status`: 任务状态
  - `generating`: 生成中
  - `done`: 完成
  - `failed`: 失败
- `error_message`: 失败原因（仅 failed 状态）
- `note_id`: 生成的笔记ID（仅 done 状态）

## API 设计

### 1. POST /notes/generate

触发笔记生成，立即返回 task_id。

**请求**：
```json
{
  "conversation_id": 64
}
```

**响应**：
```json
{
  "data": {
    "task_id": 1
  }
}
```

**逻辑**：
1. 检查该用户该对话是否有状态为 `generating` 的任务
   - 有：直接返回已有 task_id（并发控制）
   - 无：创建新任务，启动 goroutine 异步生成
2. 立即返回 task_id

### 2. GET /notes/tasks/:id

查询任务状态。

**响应（生成中）**：
```json
{
  "data": {
    "id": 1,
    "status": "generating",
    "note_id": null,
    "error_message": null
  }
}
```

**响应（完成）**：
```json
{
  "data": {
    "id": 1,
    "status": "done",
    "note_id": 123,
    "error_message": null
  }
}
```

**响应（失败）**：
```json
{
  "data": {
    "id": 1,
    "status": "failed",
    "note_id": null,
    "error_message": "AI API 调用失败: timeout"
  }
}
```

## 后端实现

### Handler 改造

```go
func (h *NoteHandler) Generate(c *gin.Context) {
    userID := middleware.GetUserID(c)

    var req struct {
        ConversationID uint `json:"conversation_id" binding:"required"`
    }
    if err := c.ShouldBindJSON(&req); err != nil {
        utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
        return
    }

    // 1. 检查是否有进行中的任务
    existingTask, _ := h.taskRepo.FindGeneratingByUserAndConversation(userID, req.ConversationID)
    if existingTask != nil {
        c.JSON(http.StatusOK, gin.H{"data": gin.H{"task_id": existingTask.ID}})
        return
    }

    // 2. 创建新任务
    task := &models.NoteGenerationTask{
        UserID:         userID,
        ConversationID: req.ConversationID,
        Status:         "generating",
    }
    if err := h.taskRepo.Create(task); err != nil {
        utils.SendError(c, http.StatusInternalServerError, "create_error", "Failed to create task")
        return
    }

    // 3. 异步执行生成
    go h.generateNoteAsync(task.ID, userID, req.ConversationID)

    // 4. 立即返回
    c.JSON(http.StatusOK, gin.H{"data": gin.H{"task_id": task.ID}})
}

func (h *NoteHandler) generateNoteAsync(taskID, userID, conversationID uint) {
    // 调用 AI 生成
    note, err := h.aiService.GenerateNoteFromConversation(context.Background(), conversationID, userID)

    if err != nil {
        // 更新任务状态为 failed
        h.taskRepo.UpdateStatus(taskID, "failed", err.Error(), nil)
        return
    }

    // 创建笔记
    newNote := &models.Note{
        UserID:               userID,
        Title:                note.Title,
        Content:              note.Content,
        SourceConversationID: &conversationID,
    }
    // ... 创建笔记和标签

    // 更新任务状态为 done
    h.taskRepo.UpdateStatus(taskID, "done", "", &newNote.ID)
}

func (h *NoteHandler) GetTask(c *gin.Context) {
    userID := middleware.GetUserID(c)
    taskID, _ := strconv.ParseUint(c.Param("id"), 10, 32)

    task, err := h.taskRepo.FindByIDAndUserID(uint(taskID), userID)
    if err != nil {
        utils.SendError(c, http.StatusNotFound, "not_found", "Task not found")
        return
    }

    c.JSON(http.StatusOK, gin.H{"data": task})
}
```

## 前端实现

### 流程

```
1. 用户点击"AI总结保存"
2. 调用 POST /notes/generate，获取 task_id
3. 显示 Toast "AI笔记生成中..."
4. 将 task_id 存入 localStorage
5. 开始轮询 GET /notes/tasks/:id（每 3 秒）
   - status=generating → 继续轮询
   - status=done → 显示"生成完成"，清除 localStorage，可选跳转到笔记
   - status=failed → 显示"生成失败: {error_message}"，清除 localStorage
6. 页面加载时检查 localStorage，如有 task_id 则恢复轮询
```

### localStorage 结构

```json
{
  "pendingNoteTask": {
    "taskId": 1,
    "conversationId": 64
  }
}
```

### React Hook 示例

```typescript
function useNoteGeneration() {
  const [isGenerating, setIsGenerating] = useState(false)

  const startGeneration = async (conversationId: number) => {
    // 1. 触发生成
    const { task_id } = await notesApi.generate({ conversation_id: conversationId })

    // 2. 存储到 localStorage
    localStorage.setItem('pendingNoteTask', JSON.stringify({
      taskId: task_id,
      conversationId
    }))

    // 3. 显示提示
    toast.info('AI笔记生成中...')
    setIsGenerating(true)

    // 4. 开始轮询
    pollTaskStatus(task_id)
  }

  const pollTaskStatus = async (taskId: number) => {
    const poll = async () => {
      const task = await notesApi.getTask(taskId)

      if (task.status === 'generating') {
        setTimeout(poll, 3000)
      } else if (task.status === 'done') {
        localStorage.removeItem('pendingNoteTask')
        setIsGenerating(false)
        toast.success('笔记生成完成')
        // 可选：跳转到笔记
      } else if (task.status === 'failed') {
        localStorage.removeItem('pendingNoteTask')
        setIsGenerating(false)
        toast.error(`生成失败: ${task.error_message}`)
      }
    }

    poll()
  }

  // 页面加载时恢复
  useEffect(() => {
    const pending = localStorage.getItem('pendingNoteTask')
    if (pending) {
      const { taskId } = JSON.parse(pending)
      setIsGenerating(true)
      pollTaskStatus(taskId)
    }
  }, [])

  return { isGenerating, startGeneration }
}
```

## 并发控制

- 同一用户同一对话同时只能有一个 `generating` 状态的任务
- 新请求直接返回已有 task_id，避免重复生成

## 错误处理

| 场景 | 处理 |
|------|------|
| AI API 调用失败 | 任务状态设为 `failed`，记录错误信息 |
| 网络超时 | AI SDK 自带超时机制，触发后按失败处理 |
| 数据库写入失败 | 返回 500 错误，不创建任务 |

## 清理策略

可选实现：定期清理已完成/失败的历史任务（保留 7 天）。

## 迁移计划

1. 创建 `note_generation_tasks` 表
2. 添加新的 API 端点
3. 前端改造：save-note-dialog.tsx 使用新的异步 API
4. 测试验证

## 决策记录

| 决策 | 选择 | 原因 |
|------|------|------|
| 流式返回 | ❌ 不使用 SSE | 实现简单，功能满足需求 |
| 状态存储 | 数据库 | 持久化，支持刷新恢复 |
| 进度显示 | 静态 Toast | 实现简单 |
| 完成后行为 | 自动保存 | 用户无额外操作 |
| 并发控制 | 同一对话单任务 | 避免重复生成 |
