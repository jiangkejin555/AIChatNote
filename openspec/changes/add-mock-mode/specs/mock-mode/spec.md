## ADDED Requirements

### Requirement: Mock mode can be configured globally

The system SHALL support a global mock mode configuration that controls whether all LLM API calls return mock data.

The configuration SHALL be available via:
1. `mock.enabled` field in `config.yaml`
2. `MOCK_ENABLED` environment variable (overrides config.yaml)

#### Scenario: Mock mode disabled by default
- **WHEN** no mock configuration is provided
- **THEN** the system SHALL use `false` as the default value for mock mode

#### Scenario: Mock mode enabled via config.yaml
- **WHEN** `mock.enabled` is set to `true` in config.yaml
- **THEN** the system SHALL operate in mock mode

#### Scenario: Mock mode enabled via environment variable
- **WHEN** environment variable `MOCK_ENABLED` is set to `true`
- **THEN** the system SHALL operate in mock mode regardless of config.yaml setting

### Requirement: AIService returns mock note generation data

When mock mode is enabled, the `GenerateNoteFromConversation` function SHALL return a fixed mock note without calling the DeepSeek API.

#### Scenario: Mock note generation
- **WHEN** mock mode is enabled
- **AND** user requests note generation from a conversation
- **THEN** the system SHALL return a mock note with:
  - `title`: a descriptive mock title
  - `content`: markdown-formatted mock content
  - `tags`: an array of mock tags
- **AND** the system SHALL NOT make any external API calls

### Requirement: ConversationHandler returns mock chat responses

When mock mode is enabled, the `SendMessage` and `Regenerate` functions SHALL return fixed mock responses without calling any LLM provider API.

#### Scenario: Mock non-streaming response
- **WHEN** mock mode is enabled
- **AND** user sends a message with `stream: false`
- **THEN** the system SHALL return a fixed mock response text
- **AND** the response SHALL be saved as an assistant message
- **AND** the system SHALL NOT make any external API calls

#### Scenario: Mock streaming response
- **WHEN** mock mode is enabled
- **AND** user sends a message with `stream: true`
- **THEN** the system SHALL return mock data in SSE format
- **AND** the content SHALL be sent character by character
- **AND** the stream SHALL end with `[DONE]` marker
- **AND** the full response SHALL be saved as an assistant message

#### Scenario: Mock regenerate response
- **WHEN** mock mode is enabled
- **AND** user requests to regenerate a response
- **THEN** the system SHALL return the same fixed mock response text
- **AND** the system SHALL NOT make any external API calls

### Requirement: Server logs mock mode status on startup

The system SHALL log the mock mode status during server initialization to help developers identify the operating mode.

#### Scenario: Startup log when mock mode is enabled
- **WHEN** the server starts with mock mode enabled
- **THEN** the system SHALL log "AI service running in MOCK mode" or similar message

#### Scenario: Startup log when mock mode is disabled
- **WHEN** the server starts with mock mode disabled
- **AND** an API key is configured
- **THEN** the system SHALL log the normal initialization message
