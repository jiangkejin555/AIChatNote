## ADDED Requirements

### Requirement: Folder tree structure
The system SHALL display folders in a hierarchical tree structure with support for unlimited nesting levels.

#### Scenario: Display root level folders
- **WHEN** user views the folder list
- **THEN** all folders with `parent_id: null` SHALL be displayed at the root level

#### Scenario: Display nested folders
- **WHEN** a folder has child folders
- **THEN** child folders SHALL be displayed indented under the parent folder

#### Scenario: Folder indentation
- **WHEN** displaying nested folders
- **THEN** each level of nesting SHALL be visually indented to indicate hierarchy

### Requirement: Folder expand/collapse
The system SHALL allow users to expand and collapse folders to show or hide their children.

#### Scenario: Expand folder
- **WHEN** user clicks on a collapsed folder
- **THEN** the folder SHALL expand and display all child folders

#### Scenario: Collapse folder
- **WHEN** user clicks on an expanded folder
- **THEN** the folder SHALL collapse and hide all child folders

#### Scenario: Expand state persistence
- **WHEN** user expands or collapses folders
- **THEN** the expand state SHALL be persisted and restored on page reload

### Requirement: All Notes as root
The system SHALL provide an "All Notes" entry as the root directory view.

#### Scenario: All Notes selection
- **WHEN** user clicks "All Notes"
- **THEN** all notes regardless of folder SHALL be displayed

#### Scenario: Default selection
- **WHEN** a new user accesses the notes page
- **THEN** "All Notes" SHALL be selected by default

### Requirement: Folder selection behavior
The system SHALL display only the notes directly in the selected folder, excluding notes from subfolders.

#### Scenario: Select folder with notes
- **WHEN** user selects a folder
- **THEN** only notes with `folder_id` matching the selected folder SHALL be displayed

#### Scenario: Select folder with subfolders
- **WHEN** user selects a folder that has subfolders with notes
- **THEN** notes in subfolders SHALL NOT be displayed
- **AND** only notes directly in the selected folder SHALL be shown
