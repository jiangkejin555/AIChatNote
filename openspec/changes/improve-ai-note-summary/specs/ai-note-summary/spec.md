## ADDED Requirements

### Requirement: AI 总结使用会话模型

AI 笔记总结功能 SHALL 使用当前会话关联的 ProviderModel 进行内容生成，而非配置文件中的固定模型。

#### Scenario: 正常生成笔记
- **WHEN** 用户请求对某个会话进行 AI 总结
- **AND** 该会话关联了一个有效的 ProviderModel
- **THEN** 系统使用该 ProviderModel 对应的 API 配置调用 AI
- **AND** 返回生成的笔记内容

#### Scenario: 会话无关联模型
- **WHEN** 用户请求对某个会话进行 AI 总结
- **AND** 该会话的 ProviderModelID 为空
- **THEN** 系统返回错误，提示"该会话没有关联模型"

#### Scenario: 关联模型已被删除
- **WHEN** 用户请求对某个会话进行 AI 总结
- **AND** 该会话关联的 ProviderModel 已被删除（软删除或不存在）
- **THEN** 系统返回错误，提示"关联的模型已不可用"

### Requirement: 优化的系统提示词

AI 笔记总结 SHALL 使用优化的系统提示词，聚焦输出核心知识点。

#### Scenario: 输出格式为 JSON
- **WHEN** AI 生成笔记内容
- **THEN** 输出 SHALL 为有效的 JSON 格式
- **AND** JSON 包含 title（不超过50字）、content（Markdown）、tags（1-3个标签）

#### Scenario: 内容结构包含核心知识点
- **WHEN** AI 生成笔记内容
- **THEN** content SHALL 包含「📌 核心知识点」区块
- **AND** 包含概念与原理、关键结论、代码示例（如有）

#### Scenario: 语言与对话一致
- **WHEN** 对话内容为中文
- **THEN** AI 输出 SHALL 使用中文
- **WHEN** 对话内容为英文
- **THEN** AI 输出 SHALL 使用英文

### Requirement: Markdown 转 HTML 存储

AI 生成的 Markdown 内容 SHALL 在保存前转换为 HTML 格式，与直接保存笔记的行为保持一致。

#### Scenario: AI 保存时转换格式
- **WHEN** 用户使用 AI 总结并保存笔记
- **THEN** 系统 SHALL 将 Markdown 内容转换为 HTML
- **AND** 存储到数据库的是 HTML 格式
- **AND** 笔记查看时正确渲染格式

## REMOVED Requirements

### Requirement: 从配置文件读取 LLM 配置

**Reason**: 改为使用会话关联的用户模型，不再需要独立的 LLM 配置

**Migration**:
- 移除 `config.yaml` 中的 `llm` 配置块
- 移除 `config.go` 中的 `NoteLLMConfig` 结构体
- 环境变量 `DEEPSEEK_API_KEY` 和 `DEEPSEEK_API_BASE` 不再生效
