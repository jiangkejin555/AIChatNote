## ADDED Requirements

### Requirement: Regenerate deletes old assistant message with FK cleanup
The system SHALL, before deleting an assistant message during regeneration, NULLify the `assistant_message_id` field on any `message_requests` rows that reference the message being deleted. This prevents foreign key constraint violations.

#### Scenario: Regenerate a message that has an associated MessageRequest
- **WHEN** user requests regeneration of an assistant message that is referenced by a `message_requests` row's `assistant_message_id`
- **THEN** the system sets `assistant_message_id` to NULL on that row, deletes the assistant message, and proceeds with regeneration

#### Scenario: Regenerate a message with no associated MessageRequest
- **WHEN** user requests regeneration of an assistant message that has no `message_requests` references
- **THEN** the system deletes the assistant message and proceeds with regeneration without errors

### Requirement: Regenerate uses streaming response via SSE
The system SHALL deliver the regenerated response as a server-sent events (SSE) stream, identical to the SendMessage streaming format. The response SHALL use `Content-Type: text/event-stream` and send chunks as `data:` events, followed by `data: [DONE]`.

#### Scenario: Successful regeneration returns SSE stream
- **WHEN** user triggers regeneration of the last assistant message
- **THEN** the backend returns an SSE stream with content chunks and a `[DONE]` sentinel, and the frontend displays tokens incrementally

### Requirement: Regenerate reuses SendMessage context building
The system SHALL use the same context building logic as SendMessage when building the message history for regeneration. This includes respecting the user's context configuration settings (simple mode with message window, or summary mode with rolling summaries).

#### Scenario: Regenerate respects summary context mode
- **WHEN** user has summary context mode enabled and triggers regeneration
- **THEN** the system builds context using the summary-based approach, same as SendMessage would

#### Scenario: Regenerate respects simple context mode
- **WHEN** user has simple context mode enabled and triggers regeneration
- **THEN** the system builds context using the recent-message-window approach, same as SendMessage would

### Requirement: Regenerate supports request deduplication
The system SHALL create a `MessageRequest` record for each regeneration request with a unique `request_id`. If a duplicate request is received while one is processing, the system SHALL return 202 Accepted. If a completed request is received again, the system SHALL return the existing response.

#### Scenario: Duplicate regeneration request while processing
- **WHEN** user triggers regeneration twice in quick succession with the same `request_id`
- **THEN** the system returns 202 Accepted for the second request instead of generating a duplicate response

### Requirement: Regenerate only allowed on completed last assistant message
The system SHALL only allow regeneration of the last assistant message in a conversation when the message has fully completed (not during streaming or timeout states). The frontend SHALL only display the regenerate button on completed assistant messages.

#### Scenario: Regenerate button shown on last completed assistant message
- **WHEN** the last assistant message in a conversation has finished generating
- **THEN** the frontend displays a regenerate button on that message

#### Scenario: Regenerate button hidden during streaming
- **WHEN** a message is currently being streamed
- **THEN** the frontend does not display a regenerate button
