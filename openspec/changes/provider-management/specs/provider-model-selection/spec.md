## ADDED Requirements

### Requirement: System can fetch available models from provider API
The system SHALL dynamically fetch available models from the provider's API when supported.

#### Scenario: Fetch models from OpenAI-compatible API
- **WHEN** user clicks "Fetch Models" button for a provider with supportsDynamicModels=true
- **THEN** system SHALL call GET /models endpoint with the provider's API key
- **AND** system SHALL display the returned model list for selection

#### Scenario: API fetch fails
- **WHEN** the model fetch API call fails (network error, invalid API key, etc.)
- **THEN** system SHALL display an error message
- **AND** system SHALL allow user to manually enter model IDs

### Requirement: System provides predefined model list for unsupported providers
The system SHALL provide a predefined model list for providers that don't support dynamic model fetching.

#### Scenario: Anthropic predefined models
- **WHEN** user configures an Anthropic provider
- **THEN** system SHALL display the following predefined models:
  - claude-sonnet-4-20250514 (Claude Sonnet 4)
  - claude-3-5-sonnet-20241022 (Claude 3.5 Sonnet)
  - claude-3-5-haiku-20241022 (Claude 3.5 Haiku)
  - claude-3-opus-20240229 (Claude 3 Opus)

### Requirement: User can select multiple models
The system SHALL allow users to select multiple models from the available model list.

#### Scenario: Select models with checkboxes
- **WHEN** model list is displayed
- **THEN** system SHALL show each model with a checkbox
- **AND** user SHALL be able to check/uncheck multiple models

#### Scenario: Set default model
- **WHEN** user has selected at least one model
- **THEN** system SHALL allow user to mark one model as default
- **AND** system SHALL ensure only one model is marked as default per provider

### Requirement: User can enable/disable individual models
The system SHALL allow users to enable or disable individual models without deleting them.

#### Scenario: Disable a model
- **WHEN** user unchecks a previously selected model
- **THEN** system SHALL set enabled=false for that model
- **AND** the model SHALL NOT appear in the model selector dropdown

#### Scenario: Re-enable a model
- **WHEN** user checks a previously disabled model
- **THEN** system SHALL set enabled=true for that model
- **AND** the model SHALL appear in the model selector dropdown again

### Requirement: User can manually add model ID
The system SHALL allow users to manually enter a model ID when the desired model is not in the list.

#### Scenario: Manual model entry
- **WHEN** user clicks "Add Model Manually" button
- **THEN** system SHALL show an input field for model ID
- **AND** system SHALL show an optional input field for display name
- **AND** system SHALL add the model to the provider's model list

### Requirement: Default model is used for new conversations
The system SHALL use the provider's default model when starting a new conversation.

#### Scenario: New conversation uses default model
- **WHEN** user starts a new conversation with a provider
- **THEN** system SHALL pre-select the provider's default model

#### Scenario: No default model set
- **WHEN** user starts a new conversation with a provider that has no default model
- **THEN** system SHALL pre-select the first enabled model in the list
