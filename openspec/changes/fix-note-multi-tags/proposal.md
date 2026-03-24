## Why

当前笔记系统存在一个严重的 Bug：用户可以为笔记添加多个标签，但保存后只剩一个标签。这是因为后端在保存标签时忽略了 `CreateTags` 的错误返回值，导致部分标签保存失败但 API 仍返回"成功"响应，造成数据不一致。

## What Changes

- **修复错误处理**：在 `NoteHandler.Create` 和 `NoteHandler.Update` 中正确处理 `CreateTags` 的错误
- **添加事务支持**：确保 Note 创建和 Tags 创建的原子性，要么全部成功，要么全部回滚
- **添加日志记录**：当标签保存失败时记录错误日志，便于排查问题
- **改进 API 响应**：如果标签保存失败，返回明确的错误信息

## Capabilities

### New Capabilities

- `note-tag-persistence`: 笔记标签持久化功能，确保多标签能够正确保存和读取

### Modified Capabilities

无（这是 Bug 修复，不改变 API 契约）

## Impact

**影响的代码：**
- `backend/internal/handlers/note.go` - Create 和 Update 方法
- `backend/internal/repository/note.go` - 可能需要添加事务支持

**数据库影响：**
- 无表结构变更
- 现有数据不受影响

**API 影响：**
- 无 API 契约变更
- 错误情况下可能返回 500 错误（之前会静默失败）
