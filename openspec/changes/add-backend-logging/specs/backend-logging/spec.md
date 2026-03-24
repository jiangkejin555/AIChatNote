## ADDED Requirements

### Requirement: Log Format Standardization

All backend logs SHALL follow a unified format: `[ModuleName] Operation: key=value, key=value`

#### Scenario: Handler logs operation start
- **WHEN** a handler method begins processing a request
- **THEN** system logs `[HandlerName] Method started: userID=<id>, params...`

#### Scenario: Handler logs operation success
- **WHEN** a handler method completes successfully
- **THEN** system logs `[HandlerName] Method success: result=<summary>`

#### Scenario: Handler logs operation failure
- **WHEN** a handler method encounters an error
- **THEN** system logs `[HandlerName] Method failed: error=<error message>`

---

### Requirement: Authentication Logging

The system SHALL log all authentication-related events for security auditing.

#### Scenario: User registration
- **WHEN** a new user registers
- **THEN** system logs `[AuthHandler] Register: email=<email>, success=<true/false>`

#### Scenario: User login success
- **WHEN** a user logs in successfully
- **THEN** system logs `[AuthHandler] Login success: userID=<id>, email=<email>`

#### Scenario: User login failure
- **WHEN** a user login attempt fails
- **THEN** system logs `[AuthHandler] Login failed: email=<email>, reason=<reason>`

#### Scenario: Token refresh
- **WHEN** a token refresh is attempted
- **THEN** system logs `[AuthHandler] Token refresh: userID=<id>, success=<true/false>`

#### Scenario: User logout
- **WHEN** a user logs out
- **THEN** system logs `[AuthHandler] Logout: userID=<id>`

---

### Requirement: Middleware Authentication Logging

The authentication middleware SHALL log token validation results.

#### Scenario: Token validation success
- **WHEN** a valid token is presented
- **THEN** system logs `[AuthMiddleware] Token validated: userID=<id>`

#### Scenario: Token validation failure
- **WHEN** token validation fails
- **THEN** system logs `[AuthMiddleware] Token validation failed: reason=<expired|invalid|missing>`

---

### Requirement: Conversation and AI Logging

The system SHALL log conversation operations and AI API calls with timing information.

#### Scenario: Message sent to conversation
- **WHEN** a user sends a message
- **THEN** system logs `[ConversationHandler] SendMessage: convID=<id>, userID=<id>, stream=<true/false>`

#### Scenario: AI API call
- **WHEN** the system calls an AI provider API
- **THEN** system logs `[ConversationHandler] AI call: provider=<name>, model=<model>, latency=<ms>ms`

#### Scenario: AI API call failure
- **WHEN** an AI API call fails
- **THEN** system logs `[ConversationHandler] AI call failed: provider=<name>, error=<error>`

#### Scenario: Stream response start
- **WHEN** a streaming response begins
- **THEN** system logs `[ConversationHandler] Stream started: convID=<id>`

#### Scenario: Stream response complete
- **WHEN** a streaming response completes
- **THEN** system logs `[ConversationHandler] Stream completed: convID=<id>, latency=<ms>ms`

#### Scenario: Message regeneration
- **WHEN** a message is regenerated
- **THEN** system logs `[ConversationHandler] Regenerate: convID=<id>, msgID=<id>`

---

### Requirement: Provider Management Logging

The system SHALL log provider management operations.

#### Scenario: Provider creation
- **WHEN** a new provider is created
- **THEN** system logs `[ProviderHandler] Create: userID=<id>, type=<type>, name=<name>`

#### Scenario: Provider update
- **WHEN** a provider is updated
- **THEN** system logs `[ProviderHandler] Update: providerID=<id>, fields=<changed fields>`

#### Scenario: Provider deletion
- **WHEN** a provider is deleted
- **THEN** system logs `[ProviderHandler] Delete: providerID=<id>, userID=<id>`

#### Scenario: Connection test
- **WHEN** a provider connection is tested
- **THEN** system logs `[ProviderHandler] TestConnection: providerID=<id>, success=<true/false>, latency=<ms>ms`

#### Scenario: Fetch available models
- **WHEN** available models are fetched from provider
- **THEN** system logs `[ProviderHandler] FetchModels: providerID=<id>, count=<number>, latency=<ms>ms`

---

### Requirement: Note Operations Logging

The system SHALL log note CRUD operations and import/export actions.

#### Scenario: Note creation with tags
- **WHEN** a note is created with tags
- **THEN** system logs `[NoteHandler] Create: userID=<id>, title=<title>, tags=<count>`

#### Scenario: Note update with tags
- **WHEN** a note is updated with new tags
- **THEN** system logs `[NoteHandler] Update: noteID=<id>, tagsUpdated=<true/false>`

#### Scenario: Note import
- **WHEN** a note is imported from file
- **THEN** system logs `[NoteHandler] Import: userID=<id>, filename=<name>, success=<true/false>`

#### Scenario: Batch export
- **WHEN** notes are exported in batch
- **THEN** system logs `[NoteHandler] ExportBatch: userID=<id>, count=<number>`

#### Scenario: Batch delete
- **WHEN** notes are deleted in batch
- **THEN** system logs `[NoteHandler] BatchDelete: userID=<id>, count=<number>, success=<true/false>`

#### Scenario: AI note generation
- **WHEN** a note is generated from conversation via AI
- **THEN** system logs `[NoteHandler] Generate: convID=<id>, latency=<ms>ms`

---

### Requirement: Sensitive Data Masking

The system SHALL mask sensitive information in all log outputs.

#### Scenario: API Key masking
- **WHEN** an API key needs to be logged
- **THEN** system masks the key as `<prefix>****<suffix>` where only first 4 and last 4 characters are visible

#### Scenario: Token masking
- **WHEN** a token needs to be logged
- **THEN** system masks the token showing only first 8 characters followed by ****

#### Scenario: Password never logged
- **WHEN** any log statement is written
- **THEN** user passwords SHALL NOT appear in any log output

---

### Requirement: External Call Latency Logging

The system SHALL record latency for external API calls.

#### Scenario: AI provider call latency
- **WHEN** an AI provider API call completes
- **THEN** system logs the total latency in milliseconds

#### Scenario: External HTTP call latency
- **WHEN** any external HTTP call completes (e.g., fetching available models)
- **THEN** system logs the total latency in milliseconds

#### Scenario: Latency threshold warning
- **WHEN** an external call takes longer than 5000ms
- **THEN** system includes a `slow=true` flag in the log
