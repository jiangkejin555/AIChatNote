## Context

当前系统使用扁平的 Model 结构存储模型配置，每个配置包含 name、api_base、api_key、model_name 等字段。这种设计导致：
- 同一提供商多个模型需要重复配置 API Key
- 无法利用各提供商的模型列表 API
- 用户配置新提供商时需要手动填写所有信息

新的设计采用 Provider-Model 分层结构，Provider 存储共享配置（API Key、Base URL），Model 存储具体模型配置。

## Goals / Non-Goals

**Goals:**
- 实现 Provider-Model 分层数据模型
- 支持动态获取提供商可用模型列表
- 提供 8 种预设提供商模板（OpenAI、火山引擎、深度求索、Anthropic、Google Gemini、月之暗面、智谱AI、自定义）
- 后端统一处理不同提供商的 API 差异（Adapter 模式）
- 前端实现简化的卡片列表式管理界面

**Non-Goals:**
- 不实现 Cherry Studio 风格的左右分栏布局
- 不在前端存储 API Key（仅后端存储）
- 不支持非 OpenAI 兼容的 API 格式（如原生 Gemini API）

## Decisions

### 1. 数据模型设计

**决策**：采用 Provider-Model 分层结构

```
┌──────────────────────┐        ┌──────────────────────┐
│ Provider             │   1:N  │ ProviderModel        │
├──────────────────────┤  ───▶  ├──────────────────────┤
│ id: uuid             │        │ id: uuid             │
│ user_id: uuid        │        │ provider_id: uuid    │
│ name: string         │        │ model_id: string     │ ← API返回的模型标识
│ type: enum           │        │ display_name: string │ ← 用户友好名称
│ api_base: string     │        │ is_default: boolean  │
│ api_key: string      │        │ enabled: boolean     │
│ created_at           │        │ created_at           │
│ updated_at           │        │ updated_at           │
└──────────────────────┘        └──────────────────────┘
```

**理由**：
- 一次配置 API Key，可管理多个模型
- 支持同一提供商配置多套 API Key（个人/公司账号）
- 便于动态获取和管理模型列表

**备选方案**：保持扁平结构，添加 provider_type 字段
- 优点：改动小
- 缺点：同一提供商需重复配置 API Key

### 2. 提供商类型与预设配置

**决策**：定义 8 种提供商类型，每种类型包含预设配置

| type | 名称 | 默认 API Base | 支持动态模型 |
|------|------|---------------|--------------|
| openai | OpenAI | https://api.openai.com/v1 | ✅ |
| volcengine | 火山引擎 | https://ark.cn-beijing.volces.com/api/v3 | ✅ |
| deepseek | 深度求索 | https://api.deepseek.com | ✅ |
| anthropic | Anthropic | https://api.anthropic.com/v1 | ❌ |
| google | Google Gemini | https://generativelanguage.googleapis.com/v1beta | ✅ |
| moonshot | 月之暗面 | https://api.moonshot.cn/v1 | ✅ |
| zhipu | 智谱AI | https://open.bigmodel.cn/api/paas/v4 | ⚠️ 待确认 |
| custom | 自定义 | (用户填写) | ✅ (假设兼容) |

**理由**：预设配置降低用户配置门槛，提升用户体验

### 3. 模型获取策略

**决策**：混合策略 - 动态获取 + 预定义列表 fallback

```typescript
if (providerType.supportsDynamicModels) {
  // 调用 GET /models 获取模型列表
  models = await fetchModelsFromAPI(provider)
} else {
  // 使用预定义模型列表
  models = PREDEFINED_MODELS[providerType]
}
```

**理由**：
- Anthropic 不支持动态查询模型列表
- 部分自定义 API 可能不兼容 OpenAI 格式
- 提供稳定的 fallback 机制

### 4. API 适配策略

**决策**：后端统一处理（Adapter 模式）

```
前端 → 统一请求格式 → 后端 Adapter → 各提供商 API
                        ↓
              根据 provider.type 转换格式
```

**理由**：
- API Key 在后端更安全
- 适配逻辑集中管理，便于维护
- 前端代码简洁

**备选方案**：前端适配 + 后端透传
- 优点：后端简单
- 缺点：前端复杂，API Key 暴露风险

### 5. UI 设计

**决策**：简化的卡片列表式布局

```
┌────────────────────────────────────────────────────────┐
│  [+ 添加提供商]                                        │
├────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🔷 OpenAI (个人)                        [编辑]   │  │
│  │     API: https://api.openai.com/v1               │  │
│  │     模型: ☑ gpt-4o  ☑ gpt-4o-mini  ☐ o1-preview  │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 🔶 火山引擎 (公司)                      [编辑]   │  │
│  │     API: https://ark.cn-beijing.volces.com/...   │  │
│  │     模型: ☑ doubao-pro-32k                       │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

**理由**：
- 保持与现有设计风格一致
- 实现简单，用户易于理解
- 无需引入复杂的分栏布局

**备选方案**：Cherry Studio 风格的左右分栏
- 优点：提供商列表更清晰
- 缺点：实现复杂，与现有风格不一致

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| 旧数据迁移失败 | 提供数据迁移脚本，保留旧 models 表作为备份 |
| 动态获取模型 API 失败 | 使用预定义列表作为 fallback，允许手动输入模型 ID |
| 某些提供商 API 不兼容 OpenAI 格式 | 在 Provider 元数据中标记，后端 Adapter 处理差异 |
| 用户同一提供商配置多套 API Key 时混淆 | 允许自定义 Provider 名称，显示名称区分 |

## Migration Plan

1. **数据库迁移**：
   - 创建 providers 和 provider_models 表
   - 将旧 models 数据迁移到新表
   - 保留旧 models 表作为备份

2. **API 迁移**：
   - 新增 Provider 和 ProviderModel API
   - 更新对话创建 API，支持 provider_model_id
   - 标记旧 /models API 为 deprecated

3. **前端迁移**：
   - 实现新的提供商管理页面
   - 更新模型选择器组件
   - 移除旧模型管理相关代码

## Open Questions

1. ~~是否需要支持同一提供商配置多套 API Key？~~ → 已确认：支持
2. ~~API 适配在前端还是后端处理？~~ → 已确认：后端统一处理
3. 智谱AI 是否支持动态获取模型列表？需要验证
