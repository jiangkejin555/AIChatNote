## ADDED Requirements

### Requirement: User can list folders
The system SHALL return user's folders in tree structure.

#### Scenario: Get folder tree
- **WHEN** user requests /folders
- **THEN** system returns folders as nested tree structure
- **AND** each folder includes id, name, parent_id, timestamps
- **AND** children array contains subfolders

### Requirement: User can create folder
The system SHALL allow users to create folders for organization.

#### Scenario: Create root folder
- **WHEN** user creates folder without parent_id
- **THEN** system creates folder at root level
- **AND** parent_id is null

#### Scenario: Create nested folder
- **WHEN** user creates folder with parent_id
- **THEN** system creates folder under specified parent
- **AND** supports arbitrary nesting depth

### Requirement: User can rename folder
The system SHALL allow users to update folder name.

#### Scenario: Rename folder
- **WHEN** user updates folder name
- **THEN** system updates folder record
- **AND** updated_at is refreshed

### Requirement: User can delete folder
The system SHALL allow users to remove folders.

#### Scenario: Delete folder with notes
- **WHEN** user deletes a folder containing notes
- **THEN** folder is deleted
- **AND** notes in folder have folder_id set to null (moved to root)

#### Scenario: Delete folder with subfolders
- **WHEN** user deletes a folder with children
- **THEN** subfolders are also deleted (cascade)
- **AND** notes in all deleted folders are moved to root

### Requirement: User can copy folder
The system SHALL allow users to duplicate folder structure.

#### Scenario: Copy folder with contents
- **WHEN** user POSTs to /folders/:id/copy
- **THEN** system creates new folder with " - Copy" suffix
- **AND** system recursively copies all subfolders
- **AND** system copies all notes in folder and subfolders
