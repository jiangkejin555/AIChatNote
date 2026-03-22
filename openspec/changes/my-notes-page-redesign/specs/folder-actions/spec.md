## ADDED Requirements

### Requirement: Folder create submenu
The system SHALL provide a "+" button on each folder item for creating child items.

#### Scenario: Display create menu
- **WHEN** user clicks the "+" button on a folder
- **THEN** a dropdown menu SHALL appear with options: "New Subfolder" and "New Note"

#### Scenario: Create subfolder
- **WHEN** user clicks "New Subfolder" from the "+" menu
- **THEN** a dialog SHALL appear to enter the subfolder name
- **AND** the new folder SHALL be created with `parent_id` set to the current folder's ID

#### Scenario: Create note in folder
- **WHEN** user clicks "New Note" from the "+" menu
- **THEN** a new note editor SHALL open
- **AND** the note SHALL be associated with the current folder

### Requirement: Folder action menu
The system SHALL provide a "..." button on each folder item for folder operations.

#### Scenario: Display action menu
- **WHEN** user clicks the "..." button on a folder
- **THEN** a dropdown menu SHALL appear with options: Rename, Copy, Move, Import Markdown, Delete

### Requirement: Folder rename
The system SHALL allow users to rename folders.

#### Scenario: Rename folder
- **WHEN** user clicks "Rename" from the folder action menu
- **THEN** a dialog SHALL appear with the current folder name pre-filled
- **AND** user can enter a new name and confirm

#### Scenario: Rename validation
- **WHEN** user submits an empty folder name
- **THEN** an error message SHALL be displayed
- **AND** the rename operation SHALL NOT proceed

### Requirement: Folder copy
The system SHALL allow users to copy folders including all subfolders and notes.

#### Scenario: Copy folder
- **WHEN** user clicks "Copy" from the folder action menu
- **THEN** a copy of the folder SHALL be created with "- Copy" suffix
- **AND** all subfolders and notes SHALL be copied recursively

### Requirement: Folder move
The system SHALL allow users to move folders to a different parent folder.

#### Scenario: Move folder dialog
- **WHEN** user clicks "Move" from the folder action menu
- **THEN** a dialog SHALL appear showing available destination folders
- **AND** user can select a new parent folder or move to root

#### Scenario: Prevent circular move
- **WHEN** user attempts to move a folder into one of its own descendants
- **THEN** an error message SHALL be displayed
- **AND** the move operation SHALL be prevented

### Requirement: Folder delete with note selection
The system SHALL allow users to delete folders with selective note handling.

#### Scenario: Delete folder with notes
- **WHEN** user clicks "Delete" from the folder action menu on a folder containing notes
- **THEN** a dialog SHALL appear listing all notes in the folder
- **AND** all notes SHALL be selected by default

#### Scenario: Delete selected notes
- **WHEN** user confirms deletion with some notes selected
- **THEN** selected notes SHALL be permanently deleted
- **AND** unselected notes SHALL be moved to the root directory
- **AND** the folder SHALL be deleted

#### Scenario: Delete empty folder
- **WHEN** user deletes a folder with no notes
- **THEN** the folder SHALL be deleted immediately without showing the note selection dialog

### Requirement: Import Markdown to folder
The system SHALL allow users to import Markdown files into a folder.

#### Scenario: Import from folder menu
- **WHEN** user clicks "Import Markdown" from the folder action menu
- **THEN** a file picker SHALL appear for selecting Markdown files
- **AND** imported notes SHALL be created in the current folder
