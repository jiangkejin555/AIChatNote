## ADDED Requirements

### Requirement: User can search notes by keyword
The system SHALL provide full-text search across note titles and content.

#### Scenario: Search notes
- **WHEN** user requests /notes?search=keyword
- **THEN** system returns notes matching the keyword
- **AND** search covers both title and content
- **AND** results are sorted by relevance

#### Scenario: No matches found
- **WHEN** search returns no results
- **THEN** system returns empty array

### Requirement: Search uses PostgreSQL full-text search
The system SHALL use built-in tsvector for search functionality.

#### Scenario: Search vector update
- **WHEN** note is created or updated
- **THEN** search_vector is automatically updated by trigger
- **AND** uses 'simple' configuration for multilingual support

#### Scenario: Search query execution
- **WHEN** user searches
- **THEN** system uses to_tsquery to match search_vector
- **AND** results are ranked using ts_rank

### Requirement: Search is scoped to user's notes
The system SHALL only search notes owned by the authenticated user.

#### Scenario: User isolation
- **WHEN** user searches
- **THEN** only their own notes are searched
- **AND** other users' notes are never returned
