## ADDED Requirements

### Requirement: User can list tags with counts
The system SHALL return all tags used by user with frequency counts.

#### Scenario: Get tags
- **WHEN** user requests /tags
- **THEN** system returns array of tags with counts
- **AND** tags are sorted by count DESC
- **AND** each tag includes name and count of notes using it

#### Scenario: No tags exist
- **WHEN** user has not created any notes with tags
- **THEN** system returns empty array

### Requirement: Tags are case-sensitive and unique per note
The system SHALL store tags as provided and prevent duplicates.

#### Scenario: Case sensitivity
- **WHEN** user saves note with tags ["React", "react"]
- **THEN** both tags are stored separately

#### Scenario: Duplicate prevention
- **WHEN** user saves note with duplicate tags ["React", "React"]
- **THEN** only one "React" tag is stored for that note
