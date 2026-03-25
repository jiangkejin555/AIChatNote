## MODIFIED Requirements

### Requirement: Send message with stream response

The system SHALL allow users to send messages to a conversation and receive AI responses via SSE stream. The API SHALL accept an optional `request_id` parameter for deduplication.

#### Scenario: Send message with request_id for deduplication
- **WHEN** client sends `POST /conversations/:id/messages` with `{ content, stream: true, request_id: "uuid-string" }`
- **THEN** system checks if `request_id` already exists
- **THEN** if new, system creates message request record and processes normally
- **THEN** if exists and completed, system returns existing assistant message
- **THEN** if exists and processing, system returns "request in progress" message

#### Scenario: Send message without request_id (backward compatible)
- **WHEN** client sends `POST /conversations/:id/messages` with `{ content, stream: true }` (no request_id)
- **THEN** system processes message without deduplication check
- **THEN** system returns SSE stream as before

#### Scenario: SSE stream includes request_id in initial chunk
- **WHEN** system starts streaming response
- **THEN** first SSE chunk includes `request_id` field for client tracking
