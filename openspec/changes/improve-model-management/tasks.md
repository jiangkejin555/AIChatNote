## 1. 数据库迁移

- [x] 1.1 创建数据库迁移文件，为 `conversations` 表新增 `model_id` 字段（VARCHAR(255)）
- [x] 1.2 编写数据迁移脚本，为现有会话回填 `model_id`（通过 `provider_model_id` 关联查询）
- [x] 1.3 更新 `Conversation` 模型，添加 `ModelID` 字段
- [x] 1.4 编写并执行迁移测试，验证数据完整性

## 2. 后端 - 硬删除实现

- [x] 2.1 修改 `ProviderModelRepository.Sync` 方法，将删除操作从软删除改为硬删除
- [x] 2.2 实现删除前查询关联会话的逻辑
- [x] 2.3 实现删除时批量更新关联会话的 `provider_model_id` 为 NULL
- [x] 2.4 编写单元测试验证硬删除逻辑

## 3. 后端 - Sync API 扩展

- [x] 3.1 扩展 `SyncProviderModelsRequest` 结构体，添加 `Enable` 和 `Disable` 字段
- [x] 3.2 修改 `ProviderModelRepository.Sync` 方法，支持批量启用/禁用操作
- [x] 3.3 添加参数校验：同一模型不能同时出现在 `enable` 和 `disable` 数组
- [x] 3.4 更新 API 文档（docs/api.yaml）
- [x] 3.5 编写 API 单元测试

## 4. 后端 - 会话处理

- [x] 4.1 修改 `CreateConversation` 逻辑，创建会话时同时保存 `model_id` 快照
- [x] 4.2 修改 `SendMessage` 逻辑，发送消息前检查 `provider_model_id` 是否为 NULL
- [x] 4.3 实现模型不存在时的错误返回："该会话使用的模型已删除，无法继续对话"
- [x] 4.4 编写单元测试验证会话创建和消息发送逻辑

## 5. 前端 - ProviderCard 改造

- [x] 5.1 移除 ProviderCard 中的星星（设置默认）按钮
- [x] 5.2 将启用模型列表改为下拉选择器形式，默认收起
- [x] 5.3 实现下拉选择器展开时显示所有启用模型及默认标记
- [x] 5.4 添加下拉选择器最大高度限制和滚动支持

## 6. 前端 - ModelSelectionDialog 增强

- [x] 6.1 为每个模型添加启用/禁用开关组件
- [x] 6.2 实现本地状态管理：`pendingEnable[]`、`pendingDisable[]`
- [x] 6.3 更新 Sync API 调用，支持传递 `enable` 和 `disable` 参数
- [x] 6.4 实现模型删除的本地状态管理和视觉反馈（删除线/灰色样式）
- [x] 6.5 修改保存逻辑，统一提交 `enable`、`disable`、`delete` 变更

## 7. 前端 - 已删除模型显示

- [x] 7.1 修改 `types/index.ts`，更新 `Conversation` 类型支持 `model_id`
- [x] 7.2 更新 `SyncModelsRequest` 和 `SyncModelsResponse` 类型
- [x] 7.3 修改 `ModelSelector` 组件，实现 "已删除 / gpt-4o" 格式的显示
- [x] 7.4 修改 ChatPage，检测模型是否删除并传递参数
- [x] 7.5 实现发送消息时模型已删除的 toast 提示

## 8. 测试与验证

- [ ] 8.1 编写后端集成测试：硬删除 → 会话关联处理 → 模型快照保留
- [ ] 8.2 编写前端 E2E 测试：模型管理 → 启用/禁用 → 删除 → 会话显示
- [ ] 8.3 手动测试完整流程：创建会话 → 删除模型 → 验证显示 → 验证发消息限制
- [ ] 8.4 性能测试：删除有大量关联会话的模型时的响应时间

## 9. 文档更新

- [x] 9.1 更新 API 文档说明新的 `enable`/`disable` 参数
- [x] 9.2 更新用户文档说明模型管理的新操作方式
