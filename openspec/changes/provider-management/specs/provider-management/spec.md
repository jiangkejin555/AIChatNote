## ADDED Requirements

### Requirement: User can create a provider
The system SHALL allow users to create a new AI provider configuration with the following fields:
- name: User-defined display name (e.g., "OpenAI (Personal)")
- type: Provider type from predefined list (openai, volcengine, deepseek, anthropic, google, moonshot, zhipu, custom)
- api_base: API endpoint URL (auto-filled based on type, but editable)
- api_key: API authentication key

#### Scenario: Create provider with preset type
- **WHEN** user selects "OpenAI" as provider type
- **THEN** system SHALL auto-fill api_base with "https://api.openai.com/v1"
- **AND** system SHALL allow user to customize the name

#### Scenario: Create provider with custom type
- **WHEN** user selects "Custom" as provider type
- **THEN** system SHALL require user to input api_base manually

#### Scenario: API key is stored securely
- **WHEN** user submits the provider form
- **THEN** system SHALL store api_key in encrypted format on the backend

### Requirement: User can edit a provider
The system SHALL allow users to modify existing provider configurations.

#### Scenario: Update provider name
- **WHEN** user changes the provider name
- **THEN** system SHALL update the display name without affecting other settings

#### Scenario: Update API key
- **WHEN** user provides a new API key
- **THEN** system SHALL replace the stored API key
- **WHEN** user leaves API key field empty
- **THEN** system SHALL keep the existing API key unchanged

### Requirement: User can delete a provider
The system SHALL allow users to remove a provider configuration.

#### Scenario: Delete provider with models
- **WHEN** user deletes a provider that has associated models
- **THEN** system SHALL delete all associated models
- **AND** system SHALL show a confirmation dialog listing affected models

#### Scenario: Delete provider used in conversations
- **WHEN** user deletes a provider with models used in existing conversations
- **THEN** system SHALL warn user that conversation history will be preserved but model reference will be invalid

### Requirement: User can view provider list
The system SHALL display all configured providers in a card list format.

#### Scenario: Display provider cards
- **WHEN** user opens the provider management page
- **THEN** system SHALL show each provider as a card with:
  - Provider icon based on type
  - Provider name
  - API base URL (truncated if too long)
  - List of enabled models with checkboxes

### Requirement: System provides predefined provider templates
The system SHALL provide 8 predefined provider types with default configurations.

#### Scenario: Predefined provider types available
- **WHEN** user creates a new provider
- **THEN** system SHALL offer the following types:
  - OpenAI (api_base: https://api.openai.com/v1)
  - 火山引擎 (api_base: https://ark.cn-beijing.volces.com/api/v3)
  - 深度求索 (api_base: https://api.deepseek.com)
  - Anthropic (api_base: https://api.anthropic.com/v1)
  - Google Gemini (api_base: https://generativelanguage.googleapis.com/v1beta)
  - 月之暗面 (api_base: https://api.moonshot.cn/v1)
  - 智谱AI (api_base: https://open.bigmodel.cn/api/paas/v4)
  - 自定义 (api_base: user input)

### Requirement: User can configure multiple providers of same type
The system SHALL allow users to create multiple providers with the same type but different configurations.

#### Scenario: Multiple OpenAI accounts
- **WHEN** user creates two providers with type "openai"
- **THEN** system SHALL allow different names (e.g., "OpenAI (Personal)", "OpenAI (Work)")
- **AND** system SHALL allow different API keys for each
