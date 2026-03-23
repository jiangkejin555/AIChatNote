## ADDED Requirements

### Requirement: User can create conversation
The system SHALL allow users to start a new conversation.

#### Scenario: Create with model
- **WHEN** user creates conversation with provider_model_id
- **THEN** system creates conversation record
- **AND** system returns conversation with id, title, timestamps

#### Scenario: Create without title
- **WHEN** user creates conversation without title
- **THEN** system uses default title "新对话"

### Requirement: User can list conversations
The system SHALL return user's conversations sorted by update time.

#### Scenario: List conversations
- **WHEN** user requests /conversations
- **THEN** system returns conversations sorted by updated_at DESC
- **AND** each conversation includes id, title, is_saved, timestamps

### Requirement: User can get conversation detail
The system SHALL return conversation with all messages.

#### Scenario: Get conversation with messages
- **WHEN** user requests /conversations/:id
- **THEN** system returns conversation metadata
- **AND** system returns all messages in chronological order

### Requirement: User can rename conversation
The system SHALL allow users to update conversation title.

#### Scenario: Rename conversation
- **WHEN** user submits new title
- **THEN** system updates conversation record
- **AND** updated_at is refreshed

### Requirement: User can delete conversation
The system SHALL allow users to remove a conversation.

#### Scenario: Delete conversation
- **WHEN** user deletes a conversation
- **THEN** system removes conversation record
- **AND** system cascade deletes all associated messages

### Requirement: User can mark conversation as saved
The system SHALL track which conversations have been converted to notes.

#### Scenario: Mark as saved
- **WHEN** user creates a note from conversation
- **THEN** system sets is_saved=true
- **AND** UI can show saved indicator

### Requirement: User can get conversation messages
The system SHALL return paginated messages for a conversation.

#### Scenario: Get messages
- **WHEN** user requests /conversations/:id/messages
- **THEN** system returns messages with id, role, content, created_at
- **AND** messages are sorted by created_at ASC

#### Scenario: Pagination with before_id
- **WHEN** user requests messages with before_id parameter
- **THEN** system returns messages created before specified id
- **AND** supports infinite scroll up
