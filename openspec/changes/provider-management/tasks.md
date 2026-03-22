## 1. API 定义更新 (docs/api.yaml)

- [x] 1.1 添加 Provider 和 ProviderModel schema 定义
- [x] 1.2 添加 Provider CRUD API 端点 (/providers)
- [x] 1.3 添加 ProviderModel CRUD API 端点 (/providers/{id}/models)
- [x] 1.4 添加动态获取模型 API 端点 (/providers/{id}/available-models)
- [x] 1.5 更新对话创建 API，支持 provider_model_id 参数
- [x] 1.6 标记旧 /models API 为 deprecated

## 2. 前端类型定义

- [x] 2.1 更新 src/types/index.ts，添加 Provider 和 ProviderModel 类型
- [x] 2.2 添加 ProviderType 枚举和预设配置类型
- [x] 2.3 更新 Conversation 类型，使用 provider_model_id 替代 model_id

## 3. 提供商预设配置

- [x] 3.1 创建 src/constants/providers.ts，定义 8 种预设提供商配置
- [x] 3.2 定义每种提供商的元数据（名称、默认 API Base、是否支持动态模型、预定义模型列表）

## 4. 前端 API 客户端

- [x] 4.1 创建 src/lib/api/providers.ts，实现 Provider CRUD API 调用
- [x] 4.2 实现 ProviderModel CRUD API 调用
- [x] 4.3 实现动态获取可用模型 API 调用
- [x] 4.4 更新 src/lib/api/index.ts，导出新的 API 模块

## 5. React Hooks

- [x] 5.1 创建 src/hooks/use-providers.ts，实现 useProviders hook
- [x] 5.2 实现 useCreateProvider、useUpdateProvider、useDeleteProvider hooks
- [x] 5.3 实现 useProviderModels hook
- [x] 5.4 实现 useAvailableModels hook（动态获取）
- [x] 5.5 更新 src/hooks/index.ts，导出新的 hooks

## 6. 提供商管理页面组件

- [x] 6.1 创建 src/components/providers/provider-card.tsx，实现提供商卡片组件
- [x] 6.2 创建 src/components/providers/provider-form-dialog.tsx，实现提供商表单对话框
- [x] 6.3 创建 src/components/providers/model-selection-dialog.tsx，实现模型选择对话框
- [x] 6.4 创建 src/components/providers/provider-list.tsx，实现提供商列表组件
- [x] 6.5 创建 src/components/providers/index.ts，导出所有组件
- [x] 6.6 更新 src/app/(main)/models/page.tsx，使用新的 ProviderList 组件

## 7. 模型选择器更新

- [x] 7.1 更新 src/components/chat/model-selector.tsx，支持按提供商分组显示模型
- [x] 7.2 更新 use-models.ts hook，使用新的 Provider-Model 结构

## 8. i18n 国际化

- [x] 8.1 更新 messages/zh.json，添加提供商管理相关翻译
- [x] 8.2 更新 messages/en.json，添加提供商管理相关翻译

## 9. 清理旧代码

- [x] 9.1 移除 src/components/models/model-form-dialog.tsx（替换为新组件）
- [x] 9.2 移除 src/lib/api/models.ts（替换为 providers.ts）
- [x] 9.3 更新相关引用
