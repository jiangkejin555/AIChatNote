## ADDED Requirements

### Requirement: Note action menu
The system SHALL provide a "..." button on each note card for note operations.

#### Scenario: Display action menu
- **WHEN** user clicks the "..." button on a note card
- **THEN** a dropdown menu SHALL appear with options: Rename, Copy, Move, Export Markdown, Delete

### Requirement: Note rename
The system SHALL allow users to rename notes.

#### Scenario: Rename note
- **WHEN** user clicks "Rename" from the note action menu
- **THEN** a dialog SHALL appear with the current note title pre-filled
- **AND** user can enter a new title and confirm

### Requirement: Note copy
The system SHALL allow users to copy notes.

#### Scenario: Copy note
- **WHEN** user clicks "Copy" from the note action menu
- **THEN** a copy of the note SHALL be created in the same folder with "- Copy" suffix
- **AND** all content and tags SHALL be copied

### Requirement: Note move
The system SHALL allow users to move notes to a different folder.

#### Scenario: Move note dialog
- **WHEN** user clicks "Move" from the note action menu
- **THEN** a dialog SHALL appear showing available destination folders
- **AND** user can select a target folder or move to root (no folder)

#### Scenario: Move note to folder
- **WHEN** user selects a target folder and confirms
- **THEN** the note's `folder_id` SHALL be updated to the target folder ID

### Requirement: Note export
The system SHALL allow users to export notes as Markdown files.

#### Scenario: Export note
- **WHEN** user clicks "Export Markdown" from the note action menu
- **THEN** a Markdown file SHALL be downloaded with filename `{note-title}.md`
- **AND** file content SHALL include the note title as `#` heading followed by the content

### Requirement: Note delete
The system SHALL allow users to delete notes.

#### Scenario: Delete note
- **WHEN** user clicks "Delete" from the note action menu
- **THEN** a confirmation dialog SHALL appear
- **AND** upon confirmation, the note SHALL be permanently deleted

#### Scenario: Delete confirmation required
- **WHEN** user attempts to delete a note
- **THEN** a confirmation dialog SHALL be required before deletion proceeds
