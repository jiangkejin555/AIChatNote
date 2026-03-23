## ADDED Requirements

### Requirement: User can create note
The system SHALL allow users to create notes with Markdown content.

#### Scenario: Create note from conversation
- **WHEN** user creates note with title, content, tags, folder_id, source_conversation_id
- **THEN** system creates note record
- **AND** content is stored in Markdown format
- **AND** tags are stored in note_tags table

#### Scenario: Create standalone note
- **WHEN** user creates note without source_conversation_id
- **THEN** system creates note record
- **AND** source_conversation_id is null

### Requirement: User can list notes
The system SHALL return user's notes with filtering options.

#### Scenario: List all notes
- **WHEN** user requests /notes without filters
- **THEN** system returns all notes sorted by updated_at DESC
- **AND** each note includes id, title, tags, folder_id, timestamps

#### Scenario: Filter by folder
- **WHEN** user requests /notes?folder_id=X
- **THEN** system returns only notes in that folder

#### Scenario: Filter by tag
- **WHEN** user requests /notes?tag=X
- **THEN** system returns notes that have that tag

### Requirement: User can get note detail
The system SHALL return full note content.

#### Scenario: Get note detail
- **WHEN** user requests /notes/:id
- **THEN** system returns note with full Markdown content
- **AND** system includes tags array

### Requirement: User can update note
The system SHALL allow users to modify note content and metadata.

#### Scenario: Update note content
- **WHEN** user updates title or content
- **THEN** system updates note record
- **AND** updated_at is refreshed

#### Scenario: Update note tags
- **WHEN** user provides new tags array
- **THEN** system replaces all existing tags
- **AND** old tags are removed from note_tags

#### Scenario: Move note to folder
- **WHEN** user updates folder_id
- **THEN** note is moved to new folder

### Requirement: User can delete note
The system SHALL allow users to remove notes.

#### Scenario: Delete note
- **WHEN** user deletes a note
- **THEN** system removes note record
- **AND** system cascade deletes associated tags

### Requirement: User can generate note with AI
The system SHALL use DeepSeek to summarize conversations into notes.

#### Scenario: Generate note preview
- **WHEN** user POSTs to /notes/generate with conversation_id
- **THEN** system fetches conversation messages
- **AND** system calls DeepSeek API with summary prompt
- **AND** system returns generated title, content (Markdown), tags

#### Scenario: AI generation fails
- **WHEN** DeepSeek API returns error
- **THEN** system returns error message
- **AND** user can retry or create note manually

### Requirement: User can copy note
The system SHALL allow users to duplicate notes.

#### Scenario: Copy note
- **WHEN** user POSTs to /notes/:id/copy
- **THEN** system creates new note with same content
- **AND** title is suffixed with " - Copy"
- **AND** tags are copied to new note

### Requirement: Note content is Markdown
The system SHALL store note content in Markdown format.

#### Scenario: Markdown preservation
- **WHEN** user saves Markdown content
- **THEN** content is stored exactly as provided
- **AND** no HTML conversion is performed
