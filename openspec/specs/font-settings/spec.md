## ADDED Requirements

### Requirement: Font size customization
The system SHALL allow users to customize the font size of UI text through three preset options: Small, Medium, and Large.

#### Scenario: User selects small font size
- **WHEN** user selects "Small" font size in settings
- **THEN** all UI text SHALL be displayed at 14px base size
- **AND** proportional scaling SHALL apply to headings and other text elements

#### Scenario: User selects medium font size (default)
- **WHEN** user selects "Medium" font size in settings or no selection is made
- **THEN** all UI text SHALL be displayed at 16px base size

#### Scenario: User selects large font size
- **WHEN** user selects "Large" font size in settings
- **THEN** all UI text SHALL be displayed at 18px base size

### Requirement: Font family customization
The system SHALL allow users to select from a list of preset font families.

#### Scenario: User selects system default font
- **WHEN** user selects "System Default" font in settings
- **THEN** the system SHALL use the device's default system font stack

#### Scenario: User selects custom preset font
- **WHEN** user selects a specific font family (e.g., Inter, Roboto)
- **THEN** the system SHALL apply that font family to all UI text

### Requirement: Font settings persistence
Font preferences MUST be persisted in localStorage and restored on subsequent visits.

#### Scenario: User returns to application
- **WHEN** user opens the application after previously setting font preferences
- **THEN** the system SHALL restore font size and family from localStorage
- **AND** apply settings before rendering the UI

### Requirement: Font settings scope
Font settings SHALL apply only to UI elements, NOT to:
- User-authored content (chat messages, notes)
- Code blocks within markdown content
- User-provided names (folder names, note titles)

#### Scenario: User views a note with mixed content
- **WHEN** user views a note containing both UI elements and user content
- **THEN** UI elements (buttons, labels, headers) SHALL use custom font settings
- **AND** user-authored content SHALL use default font settings

### Requirement: Font settings UI in settings page
The settings page MUST provide UI controls for:
- Font size selection (Small/Medium/Large radio group or segmented control)
- Font family selection (dropdown with preset options)

#### Scenario: User accesses settings page
- **WHEN** user navigates to the settings page
- **THEN** the system SHALL display font size options
- **AND** display font family dropdown
- **AND** show current selections as selected
