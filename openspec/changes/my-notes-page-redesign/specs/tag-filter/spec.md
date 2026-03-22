## ADDED Requirements

### Requirement: Tag filter UI
The system SHALL provide a tag filter control in the search bar area.

#### Scenario: Display tag filter
- **WHEN** user views the notes sidebar
- **THEN** a tag filter dropdown SHALL be displayed next to the search input

#### Scenario: Display available tags
- **WHEN** user clicks the tag filter dropdown
- **THEN** all tags with their note counts SHALL be displayed
- **AND** tags SHALL be sorted by count (descending)

### Requirement: Filter by tag
The system SHALL allow users to filter notes by selecting one or more tags.

#### Scenario: Select single tag
- **WHEN** user selects a tag from the filter dropdown
- **THEN** only notes containing the selected tag SHALL be displayed
- **AND** the tag filter SHALL show the selected tag as active

#### Scenario: Clear tag filter
- **WHEN** user clicks to clear the tag filter
- **THEN** all notes SHALL be displayed regardless of tags
- **AND** the tag filter SHALL return to its default state

### Requirement: Combined search and tag filter
The system SHALL support combining search query with tag filter.

#### Scenario: Search within tagged notes
- **WHEN** user has selected a tag filter AND entered a search query
- **THEN** notes SHALL be filtered by both conditions
- **AND** only notes matching both the tag AND search query SHALL be displayed
