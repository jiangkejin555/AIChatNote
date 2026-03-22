## ADDED Requirements

### Requirement: Import Markdown file
The system SHALL allow users to import Markdown files as notes.

#### Scenario: Select file to import
- **WHEN** user triggers import Markdown (from folder menu or note menu)
- **THEN** a file picker SHALL appear filtered to `.md` files

#### Scenario: Parse Markdown file
- **WHEN** user selects a Markdown file
- **THEN** the system SHALL parse the file content
- **AND** extract the title from the first `#` heading
- **AND** if no heading exists, use the filename (without extension) as title

#### Scenario: Create note from import
- **WHEN** Markdown file is parsed successfully
- **THEN** a new note SHALL be created with the extracted title and full content
- **AND** the note SHALL be placed in the selected folder (or root if no folder selected)

### Requirement: Import multiple files
The system SHALL allow users to import multiple Markdown files at once.

#### Scenario: Select multiple files
- **WHEN** user selects multiple Markdown files in the file picker
- **THEN** all files SHALL be imported as separate notes

#### Scenario: Import progress feedback
- **WHEN** importing multiple files
- **THEN** a progress indicator SHALL be displayed
- **AND** success/error messages SHALL be shown for each file

### Requirement: Import error handling
The system SHALL handle import errors gracefully.

#### Scenario: File read error
- **WHEN** a selected file cannot be read
- **THEN** an error message SHALL be displayed
- **AND** other files in the batch SHALL continue to be processed

#### Scenario: File size limit
- **WHEN** a file exceeds the maximum allowed size (5MB)
- **THEN** an error message SHALL be displayed indicating the file is too large
