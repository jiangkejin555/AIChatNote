## ADDED Requirements

### Requirement: Delayed conversation creation

The system SHALL create a conversation on the backend only when the user sends the first message, not when clicking "New Chat".

#### Scenario: Send first message creates conversation
- **WHEN** user is on start page (`isPendingNewChat` is `true`)
- **AND** user sends a message
- **THEN** system calls backend API to create new conversation
- **THEN** system sends the message to the new conversation
- **THEN** system sets `isPendingNewChat` to `false`
- **THEN** system sets `currentConversationId` to the new conversation ID

#### Scenario: Backend receives model selection
- **WHEN** user sends first message from start page
- **THEN** backend receives the selected model ID for conversation creation

### Requirement: Optimistic message display

The system SHALL display user's message optimistically while waiting for backend response.

#### Scenario: User message displayed immediately
- **WHEN** user sends first message from start page
- **THEN** system immediately displays the user message in chat
- **THEN** system shows loading indicator for AI response
