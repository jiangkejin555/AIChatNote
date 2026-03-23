## ADDED Requirements

### Requirement: User can export single note as Markdown
The system SHALL allow users to download individual notes.

#### Scenario: Export note
- **WHEN** user requests GET /notes/:id/export
- **THEN** system returns file with Content-Type: text/markdown
- **AND** filename is sanitized note title with .md extension
- **AND** content includes title as H1 heading
- **AND** content includes note body

### Requirement: User can batch export notes
The system SHALL allow users to export multiple notes as ZIP.

#### Scenario: Batch export selected notes
- **WHEN** user POSTs to /notes/export with array of note ids
- **THEN** system returns ZIP file
- **AND** each note is a separate .md file
- **AND** folder structure is preserved

#### Scenario: Export all notes
- **WHEN** user POSTs to /notes/export without ids
- **THEN** system exports all user's notes
- **AND** ZIP includes folder hierarchy

### Requirement: User can import Markdown file as note
The system SHALL parse uploaded Markdown files into notes.

#### Scenario: Import with frontmatter
- **WHEN** user uploads .md file with YAML frontmatter
- **THEN** system extracts title from frontmatter or first H1
- **AND** system extracts tags from frontmatter if present
- **AND** note is created in specified folder

#### Scenario: Import without frontmatter
- **WHEN** user uploads plain .md file
- **THEN** system uses first H1 as title
- **AND** filename (without .md) is used if no H1 found
- **AND** tags are empty

### Requirement: User can batch delete notes
The system SHALL allow users to delete multiple notes at once.

#### Scenario: Batch delete
- **WHEN** user POSTs to /notes/batch-delete with array of ids
- **THEN** system deletes all specified notes
- **AND** returns success status

### Requirement: User can batch move notes
The system SHALL allow users to move notes between folders.

#### Scenario: Batch move
- **WHEN** user POSTs to /notes/batch-move with ids and target_folder_id
- **THEN** all specified notes are moved to target folder
- **AND** target_folder_id=null moves to root
