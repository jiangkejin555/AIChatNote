## ADDED Requirements

### Requirement: System supports UI language switching
The system SHALL support switching the user interface language between Chinese (Simplified) and English.

#### Scenario: User switches language to English
- **WHEN** user selects "English" in settings page
- **THEN** all UI text SHALL display in English
- **AND** the language preference SHALL be persisted

#### Scenario: User switches language to Chinese
- **WHEN** user selects "简体中文" in settings page
- **THEN** all UI text SHALL display in Chinese
- **AND** the language preference SHALL be persisted

### Requirement: Language preference is persisted
The system SHALL persist the user's language preference across sessions.

#### Scenario: Language persists after page reload
- **WHEN** user has selected a language preference
- **AND** user reloads the page or closes and reopens the browser
- **THEN** the UI SHALL display in the previously selected language

### Requirement: Chat content is not translated
The system SHALL NOT translate chat messages or user-generated content when switching languages.

#### Scenario: Chat content remains unchanged after language switch
- **WHEN** user switches the UI language
- **THEN** existing chat messages SHALL remain in their original language
- **AND** new chat messages SHALL be sent and displayed without translation

### Requirement: Default language follows system preference
The system SHALL use the browser/system language as the default UI language if no user preference is set.

#### Scenario: System language is Chinese
- **WHEN** user has no saved language preference
- **AND** browser language is set to Chinese
- **THEN** UI SHALL display in Chinese

#### Scenario: System language is not supported
- **WHEN** user has no saved language preference
- **AND** browser language is not Chinese or English
- **THEN** UI SHALL default to English
