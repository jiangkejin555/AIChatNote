## ADDED Requirements

### Requirement: Title generator configuration

The system SHALL support configuration of an independent title generator through YAML configuration file and environment variables.

#### Scenario: YAML configuration loaded
- **WHEN** `config.yaml` contains `title_generator` section with `enabled: true`, `api_base`, `api_key`, and `model` fields
- **THEN** the system SHALL load these values as title generator configuration

#### Scenario: Environment variable override
- **WHEN** environment variables `TITLE_GENERATOR_ENABLED`, `TITLE_GENERATOR_API_BASE`, `TITLE_GENERATOR_API_KEY`, `TITLE_GENERATOR_MODEL`, or `TITLE_GENERATOR_MAX_TOKENS` are set
- **THEN** these values SHALL override the corresponding YAML configuration

#### Scenario: Default max tokens
- **WHEN** `max_tokens` is not configured
- **THEN** the system SHALL use default value of 50

### Requirement: Title generation with configured model

The system SHALL use the configured title generator model to generate conversation titles when enabled.

#### Scenario: Title generation succeeds
- **GIVEN** title generator is enabled and properly configured
- **WHEN** a new conversation is created with the first message
- **THEN** the system SHALL call the configured API with the first message as input
- **AND** the system SHALL use the response as the conversation title

#### Scenario: Title generation API call fails
- **GIVEN** title generator is enabled but API call fails (timeout, network error, etc.)
- **WHEN** title generation is attempted
- **THEN** the system SHALL fallback to "first 10 characters + '...'" format

### Requirement: Fallback title format

The system SHALL use a simple fallback format when title generator is disabled or not configured.

#### Scenario: Title generator disabled
- **WHEN** `title_generator.enabled` is `false` or not configured
- **THEN** the system SHALL use "first 10 characters + '...'" as title format

#### Scenario: Title generator enabled but missing required fields
- **WHEN** `title_generator.enabled` is `true` but `api_base`, `api_key`, or `model` is empty
- **THEN** the system SHALL use "first 10 characters + '...'" as title format

#### Scenario: Short message fallback
- **WHEN** fallback is used and the first message is 10 characters or less
- **THEN** the system SHALL use the entire message as title without "..." suffix
