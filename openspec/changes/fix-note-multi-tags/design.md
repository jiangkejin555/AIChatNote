## Context

### 问题描述

当前笔记创建/更新流程存在数据一致性问题：

```go
// handlers/note.go:113-121 (Create 方法)
if len(req.Tags) > 0 {
    tags := make([]models.NoteTag, len(req.Tags))
    for i, tag := range req.Tags {
        tags[i] = models.NoteTag{NoteID: note.ID, Tag: tag}
    }
    h.noteRepo.CreateTags(tags)  // ← 错误被忽略！
    note.Tags = tags              // ← 即使失败也返回"成功"
}
```

**问题链路**：
1. 前端发送 `["tag1", "tag2"]`
2. 后端创建 Note 成功
3. 后端尝试批量插入 Tags，但只成功插入部分或全部失败
4. API 返回 201 Created，包含完整的 tags 数组
5. 用户刷新页面，从数据库读取的数据只有部分标签

### 约束条件

- 不修改 API 契约
- 不修改数据库表结构
- 需要保持向后兼容

## Goals / Non-Goals

**Goals:**
- 确保 Note 和 Tags 的原子性保存
- 正确处理和报告标签保存错误
- 添加日志帮助调试

**Non-Goals:**
- 不修改前端代码
- 不修改数据库表结构
- 不添加新的 API 端点

## Decisions

### Decision 1: 事务处理策略

**选择**: 使用 GORM 事务包装 Note 创建和 Tags 创建

```go
// 方案 A: 在 Handler 层使用事务
err := database.DB.Transaction(func(tx *gorm.DB) error {
    if err := tx.Create(note).Error; err != nil {
        return err
    }
    if len(req.Tags) > 0 {
        tags := buildTags(note.ID, req.Tags)
        if err := tx.Create(&tags).Error; err != nil {
            return err
        }
    }
    return nil
})
```

**方案对比**:

| 方案 | 优点 | 缺点 |
|------|------|------|
| A. Handler 层事务 | 简单直接，修改范围小 | 违反分层原则 |
| B. Repository 层事务 | 符合分层设计 | 需要修改多个 Repository |
| C. Service 层事务 | 最佳实践 | 需要新增 Service 层 |

**选择 A**，原因：
- 修改范围最小，风险最低
- 当前项目没有 Service 层
- 快速修复 Bug，后续可重构

### Decision 2: 错误处理策略

**选择**: 标签保存失败时返回 500 错误，不部分成功

```go
if err := h.noteRepo.CreateTags(tags); err != nil {
    // 回滚事务，返回错误
    utils.SendErrorWithErr(c, http.StatusInternalServerError, "tag_error", "Failed to save tags", err)
    return
}
```

**原因**：
- 保证数据一致性
- 用户可以重试保存
- 避免数据处于不一致状态

### Decision 3: 日志策略

**选择**: 在关键点添加结构化日志

```go
log.Printf("[NoteHandler] Creating note for user %d with %d tags", userID, len(req.Tags))
// ...
if err := h.noteRepo.CreateTags(tags); err != nil {
    log.Printf("[NoteHandler] CreateTags failed: noteID=%d, tags=%v, error=%v", note.ID, req.Tags, err)
    // ...
}
```

## Risks / Trade-offs

### Risk 1: 事务性能影响

**风险**: 长事务可能影响数据库性能
**缓解**: Note + Tags 事务非常短（毫秒级），影响可忽略

### Risk 2: 现有行为变更

**风险**: 之前静默失败，现在会返回错误
**缓解**: 这是正确的行为，用户可以重试。可在发布说明中说明此变更

### Risk 3: 兼容性

**风险**: 某些客户端可能依赖静默失败行为
**缓解**: 预期没有客户端依赖此 Bug
