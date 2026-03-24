## 1. 后端 API 实现

- [x] 1.1 定义 SyncModelsRequest 和 SyncModelsResponse 结构体（backend/internal/handlers/provider_model.go）
- [x] 1.2 实现 SyncModels handler（backend/internal/handlers/provider_model.go）
- [x] 1.3 实现 SyncModels repository 方法，使用数据库事务（backend/internal/repository/provider_model.go）
- [x] 1.4 注册路由 POST /providers/:id/models/sync（backend/cmd/server/main.go）
- [x] 1.5 更新 API 文档（backend/docs/design.md）
- [x] 1.6 编写单元测试（backend/internal/handlers/provider_model_test.go）

## 2. 前端 API 层

- [x] 2.1 定义 SyncModelsRequest 和 SyncModelsResponse 类型（frontend/src/types/index.ts）
- [x] 2.2 实现 syncModels API 方法（frontend/src/lib/api/providers.ts）
- [x] 2.3 实现 useSyncProviderModels hook（frontend/src/hooks/use-providers.ts）

## 3. 前端组件重构

- [x] 3.1 创建 AvailableModelsDialog 子组件（可用模型列表对话框）
- [x] 3.2 重构 ModelSelectionDialog 主组件：
  - [x] 3.2.1 主列表改为展示已配置模型（从 provider.models 获取）
  - [x] 3.2.2 添加删除模型功能
  - [x] 3.2.3 添加"获取可用模型"按钮，打开子对话框
  - [x] 3.2.4 实现本地状态管理（添加/删除/设为默认）
  - [x] 3.2.5 保存按钮调用 sync API
  - [x] 3.2.6 未保存更改提示

## 4. 国际化

- [x] 4.1 添加中文文案（frontend/messages/zh.json）
- [x] 4.2 添加英文文案（frontend/messages/en.json）

## 5. 测试与验证

- [x] 5.1 后端单元测试通过
- [ ] 5.2 前端组件功能测试
- [ ] 5.3 端到端测试：添加模型流程
- [ ] 5.4 端到端测试：删除模型流程
- [ ] 5.5 端到端测试：批量操作流程
