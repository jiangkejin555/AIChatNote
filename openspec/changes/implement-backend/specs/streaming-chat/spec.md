## ADDED Requirements

### Requirement: User can send message and receive streaming response
The system SHALL accept user messages and return AI responses via SSE.

#### Scenario: Send message with streaming
- **WHEN** user POSTs to /conversations/:id/messages with content and stream=true
- **THEN** system responds with Content-Type: text/event-stream
- **AND** system streams AI response chunks in OpenAI format
- **AND** stream ends with "data: [DONE]"

#### Scenario: Send message without streaming
- **WHEN** user POSTs with stream=false
- **THEN** system returns complete message as JSON
- **AND** response includes full assistant message

### Requirement: System uses configured provider for chat
The system SHALL route chat requests to user's configured LLM provider.

#### Scenario: Chat with OpenAI provider
- **WHEN** conversation uses OpenAI provider model
- **THEN** system calls OpenAI API with user's api_key
- **AND** system includes conversation history as context

#### Scenario: Provider API error
- **WHEN** provider returns error (rate limit, invalid key, etc.)
- **THEN** system returns user-friendly error message
- **AND** error is logged with details for debugging

### Requirement: System preserves chat history
The system SHALL store all user and assistant messages.

#### Scenario: Save user message
- **WHEN** user sends a message
- **THEN** system creates message record with role="user"
- **AND** message includes content and conversation_id

#### Scenario: Save assistant response
- **WHEN** streaming completes
- **THEN** system creates message record with role="assistant"
- **AND** conversation updated_at is refreshed

### Requirement: User can regenerate AI response
The system SHALL allow users to request a new AI response.

#### Scenario: Regenerate last assistant message
- **WHEN** user POSTs to /conversations/:id/messages/:msgId/regenerate
- **THEN** system deletes the original assistant message
- **AND** system generates new response using same context
- **AND** new message is stored with new id

### Requirement: SSE response format follows OpenAI standard
The system SHALL return SSE data compatible with OpenAI format.

#### Scenario: Stream chunk format
- **WHEN** streaming response chunks
- **THEN** each chunk follows format: data: {"id":"xxx","choices":[{"delta":{"content":"..."}}]}
- **AND** finish_reason is null during streaming
- **AND** finish_reason is "stop" on final chunk

### Requirement: API key is decrypted for LLM calls
The system SHALL decrypt stored API keys when making LLM API calls.

#### Scenario: Decrypt for API call
- **WHEN** system calls LLM provider API
- **THEN** api_key is decrypted from stored ciphertext
- **AND** decrypted key is used for authentication
- **AND** decrypted key is never logged or persisted
