# Note Creation Specification

## ADDED Requirements

### Requirement: User can save conversation as note with AI summary

The system SHALL allow users to convert conversations into structured notes.

#### Scenario: Open save note dialog
- **WHEN** user clicks "保存为笔记" button in conversation
- **THEN** dialog opens with AI-generated title, summary, and suggested tags
- **THEN** user can edit all fields

#### Scenario: AI generates summary
- **WHEN** save note dialog opens
- **THEN** system calls AI to generate summary from conversation
- **THEN** summary is displayed in Markdown format
- **THEN** loading indicator shows during generation

#### Scenario: Edit AI-generated content
- **WHEN** user modifies title, content, or tags
- **THEN** changes are reflected in preview
- **THEN** user can add or remove tags

### Requirement: User can select folder for note

The system SHALL allow users to organize notes into folders.

#### Scenario: Select existing folder
- **WHEN** user opens folder dropdown in save dialog
- **THEN** folder tree is displayed
- **WHEN** user selects a folder
- **THEN** folder name is shown in dropdown

#### Scenario: Create new folder inline
- **WHEN** user clicks "新建文件夹" in dropdown
- **THEN** inline input appears for folder name
- **WHEN** user enters name and confirms
- **THEN** new folder is created and selected

### Requirement: User can save note successfully

The system SHALL create notes from conversations.

#### Scenario: Save note successfully
- **WHEN** user clicks "保存" in save dialog
- **THEN** note is created with title, content, tags, and folder
- **THEN** conversation is marked as saved
- **THEN** success toast is displayed
- **THEN** dialog closes

#### Scenario: Save note with minimal fields
- **WHEN** user saves without editing AI-generated content
- **THEN** note is created with AI-generated content as-is

### Requirement: User can regenerate AI summary

The system SHALL allow users to regenerate AI-generated summaries.

#### Scenario: Regenerate summary
- **WHEN** user clicks "重新生成" button in save dialog
- **THEN** loading indicator shows
- **THEN** new summary replaces previous content
- **THEN** new tags are suggested

### Requirement: Note content is rendered as Markdown

The system SHALL render note content with full Markdown support.

#### Scenario: Display Markdown content
- **WHEN** note is displayed
- **THEN** content is rendered with formatting (headers, lists, code blocks, etc.)
- **THEN** GitHub Flavored Markdown features are supported (tables, task lists)
