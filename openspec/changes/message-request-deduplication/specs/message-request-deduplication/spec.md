## ADDED Requirements

### Requirement: Request ID Generation

The frontend SHALL generate a unique `request_id` (UUID v4 format) for each user message using `crypto.randomUUID()`.

#### Scenario: Generate request ID on message send
- **WHEN** user sends a new message
- **THEN** system generates a unique UUID v4 as `request_id`

#### Scenario: Reuse request ID on retry
- **WHEN** user clicks retry after timeout
- **THEN** system reuses the same `request_id` from the original failed request

---

### Requirement: Request Deduplication Storage

The system SHALL store request metadata in a `message_requests` table with the following structure:
- `id`: Primary key
- `conversation_id`: Foreign key to conversations
- `request_id`: UUID string (UNIQUE constraint)
- `user_message_id`: Foreign key to user message (nullable)
- `assistant_message_id`: Foreign key to assistant message (nullable)
- `status`: Enum of 'pending', 'processing', 'completed', 'failed'
- `created_at`, `updated_at`: Timestamps

#### Scenario: Create request record on first attempt
- **WHEN** backend receives a message with new `request_id`
- **THEN** system creates a new record in `message_requests` with status 'processing'

#### Scenario: Unique constraint prevents duplicate records
- **WHEN** two concurrent requests with same `request_id` arrive
- **THEN** only one record is created, the other receives constraint violation error

---

### Requirement: Duplicate Request Detection

The system SHALL detect and handle duplicate requests based on `request_id`.

#### Scenario: Return existing response for completed request
- **WHEN** backend receives a request with `request_id` that has status 'completed'
- **THEN** system returns the existing `assistant_message` without reprocessing

#### Scenario: Wait for in-progress request
- **WHEN** backend receives a request with `request_id` that has status 'processing'
- **THEN** system returns a message indicating the request is being processed

#### Scenario: Allow retry for failed request
- **WHEN** backend receives a request with `request_id` that has status 'failed'
- **THEN** system may retry the request

---

### Requirement: Request ID Parameter

The API endpoint `POST /conversations/:id/messages` SHALL accept an optional `request_id` parameter.

#### Scenario: Request with request_id
- **WHEN** client sends message with `request_id` parameter
- **THEN** system applies deduplication logic

#### Scenario: Request without request_id (backward compatibility)
- **WHEN** client sends message without `request_id` parameter
- **THEN** system processes normally without deduplication
