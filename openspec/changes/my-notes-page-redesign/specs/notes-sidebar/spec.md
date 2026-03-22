## MODIFIED Requirements

### Requirement: Sidebar layout
The system SHALL display the notes sidebar with a redesigned layout for improved organization.

#### Scenario: Display sidebar components
- **WHEN** user views the notes page
- **THEN** the sidebar SHALL display in order:
  1. Title "My Notes" (changed from "Knowledge Base")
  2. Search bar with tag filter in same row
  3. Folder tree with "All Notes" at root
  4. "New Note" button
  5. Notes list

#### Scenario: Search and filter row
- **WHEN** user views the sidebar
- **THEN** search input and tag filter dropdown SHALL be displayed in the same row

### Requirement: Note editor header
The system SHALL display the current folder path and require a note title in the editor.

#### Scenario: Display folder path
- **WHEN** user creates or edits a note in a folder
- **THEN** the folder path SHALL be displayed at the top of the editor
- **AND** the path SHALL show the full hierarchy (e.g., "技术笔记 / React")

#### Scenario: Title input with label
- **WHEN** user views the note editor
- **THEN** a "File Name" label SHALL be displayed before the title input
- **AND** the title input SHALL be marked as required

#### Scenario: Title validation on save
- **WHEN** user attempts to save a note with empty title
- **THEN** an error message "Please enter file name" SHALL be displayed
- **AND** the save operation SHALL be prevented

#### Scenario: Title whitespace validation
- **WHEN** user attempts to save a note with only whitespace in the title
- **THEN** an error message SHALL be displayed
- **AND** the save operation SHALL be prevented
