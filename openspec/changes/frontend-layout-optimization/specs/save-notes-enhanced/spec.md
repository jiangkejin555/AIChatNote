## ADDED Requirements

### Requirement: Floating action button for save notes
The system SHALL provide a floating action button (FAB) in the bottom-right corner of the chat page for saving notes.

#### Scenario: FAB is visible on chat page
- **WHEN** user is on the chat page
- **THEN** a floating "Save as Note" button SHALL be visible in the bottom-right corner

#### Scenario: FAB opens save dialog
- **WHEN** user clicks the floating "Save as Note" button
- **THEN** the Save Note dialog SHALL open

### Requirement: Support selecting multiple conversations
The system SHALL allow users to select multiple conversations to save as a single note.

#### Scenario: User selects current conversation only
- **WHEN** user chooses "Current conversation" option
- **THEN** only the active conversation SHALL be included in the save

#### Scenario: User selects specific conversations
- **WHEN** user chooses "Select conversations" option
- **AND** selects multiple conversations from the list
- **THEN** the selected conversations SHALL be combined into one note

#### Scenario: User selects all conversations
- **WHEN** user chooses "All conversations" option
- **THEN** all conversations SHALL be combined into one note

### Requirement: Support different save modes
The system SHALL support two save modes: AI Summary and Direct Save.

#### Scenario: User chooses AI Summary mode
- **WHEN** user selects "AI Summary" option
- **THEN** the system SHALL use AI to generate a summary of the conversation(s)
- **AND** the note content SHALL be the AI-generated summary

#### Scenario: User chooses Direct Save mode
- **WHEN** user selects "Direct Save" option
- **THEN** the system SHALL save the raw conversation content
- **AND** the note content SHALL be the original conversation text

### Requirement: Asynchronous save with notification
The system SHALL save notes asynchronously and notify the user upon completion.

#### Scenario: Save starts in background
- **WHEN** user clicks "Confirm Save" button
- **THEN** the dialog SHALL close immediately
- **AND** a toast notification SHALL show "Saving in background..."

#### Scenario: Save completes successfully
- **WHEN** the background save operation completes successfully
- **THEN** a toast notification SHALL show "Note saved successfully"

#### Scenario: Save fails
- **WHEN** the background save operation fails
- **THEN** a toast notification SHALL show "Failed to save note" with error details

### Requirement: Support folder and tag selection
The system SHALL allow users to select a target folder and add tags when saving notes.

#### Scenario: User selects a folder
- **WHEN** user selects a folder from the dropdown
- **THEN** the note SHALL be saved to that folder

#### Scenario: User adds tags
- **WHEN** user enters tags in the tag input
- **THEN** the tags SHALL be associated with the saved note

#### Scenario: Existing tags are suggested
- **WHEN** the tag input is focused
- **THEN** existing tags from previous notes SHALL be displayed as suggestions
