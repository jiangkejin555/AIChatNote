# Knowledge Base Specification

## ADDED Requirements

### Requirement: User can view notes list

The system SHALL display all user's notes in a list view.

#### Scenario: Display notes list
- **WHEN** user navigates to knowledge base page
- **THEN** all notes are displayed in reverse chronological order
- **THEN** each note card shows title, tags, folder name, and date

#### Scenario: Empty notes list
- **WHEN** user has no notes
- **THEN** empty state with prompt to save first note is displayed

### Requirement: User can filter notes by folder

The system SHALL allow users to filter notes by folder.

#### Scenario: Filter by folder
- **WHEN** user clicks a folder in sidebar
- **THEN** only notes in that folder are displayed
- **THEN** subfolders are included if viewing parent folder

#### Scenario: View all notes
- **WHEN** user clicks "全部笔记" in sidebar
- **THEN** notes from all folders are displayed

### Requirement: User can filter notes by tag

The system SHALL allow users to filter notes by tag.

#### Scenario: Filter by tag
- **WHEN** user clicks a tag in tag cloud
- **THEN** only notes with that tag are displayed
- **THEN** selected tag is highlighted

#### Scenario: Clear tag filter
- **WHEN** user clicks "全部" or selected tag again
- **THEN** tag filter is cleared
- **THEN** all notes are displayed

### Requirement: User can search notes

The system SHALL allow users to search notes by keyword.

#### Scenario: Search notes
- **WHEN** user types in search box
- **THEN** notes are filtered by keyword matching title or content
- **THEN** search is debounced (300ms delay)

#### Scenario: No search results
- **WHEN** search returns no results
- **THEN** "未找到相关笔记" message is displayed

### Requirement: User can view note detail

The system SHALL allow users to view full note content.

#### Scenario: View note detail
- **WHEN** user clicks a note card
- **THEN** note detail panel opens
- **THEN** full Markdown content is rendered
- **THEN** tags and folder are displayed

### Requirement: User can edit note

The system SHALL allow users to modify existing notes.

#### Scenario: Edit note
- **WHEN** user clicks edit button on note
- **THEN** edit form opens with current content
- **WHEN** user saves changes
- **THEN** note is updated
- **THEN** changes are reflected in note list

### Requirement: User can delete note

The system SHALL allow users to remove notes.

#### Scenario: Delete note with confirmation
- **WHEN** user clicks delete button and confirms
- **THEN** note is removed from database
- **THEN** note disappears from list

### Requirement: User can move note to another folder

The system SHALL allow users to reorganize notes.

#### Scenario: Move note to folder
- **WHEN** user selects "移动到" on note
- **THEN** folder selector appears
- **WHEN** user selects new folder
- **THEN** note is moved to new folder
- **THEN** folder counts are updated

### Requirement: User can export note as Markdown

The system SHALL allow users to export individual notes.

#### Scenario: Export single note
- **WHEN** user clicks "导出" on note
- **THEN** .md file is downloaded with note title as filename
- **THEN** file contains Markdown content

### Requirement: User can batch export notes

The system SHALL allow users to export multiple notes.

#### Scenario: Batch export notes
- **WHEN** user selects multiple notes and clicks "批量导出"
- **THEN** ZIP file is downloaded containing all selected notes as .md files

### Requirement: User can manage folders

The system SHALL allow users to create, rename, and delete folders.

#### Scenario: Create folder
- **WHEN** user clicks "新建文件夹"
- **THEN** inline input appears
- **WHEN** user enters name and confirms
- **THEN** folder appears in sidebar

#### Scenario: Rename folder
- **WHEN** user clicks rename on folder
- **THEN** inline edit mode activates
- **WHEN** user saves new name
- **THEN** folder name is updated

#### Scenario: Delete folder
- **WHEN** user clicks delete on folder and confirms
- **THEN** folder is removed
- **THEN** notes in folder have folder_id set to null (not deleted)

### Requirement: User can view tag statistics

The system SHALL display tag usage counts.

#### Scenario: Display tag cloud
- **WHEN** user views knowledge base sidebar
- **THEN** all tags are displayed with usage counts
- **THEN** tags are sorted by count (most used first)
