## ADDED Requirements

### Requirement: Interface text supports language switching
The system SHALL provide complete internationalization (i18n) support for all UI text elements.
All UI text MUST be externalized and loaded from translation files based on the selected language.

#### Scenario: User switches language to English
- **WHEN** user selects "English" in settings
- **THEN** all UI text (buttons, labels, placeholders, error messages, titles) SHALL display in English

#### Scenario: User switches language to Chinese
- **WHEN** user selects "简体中文" in settings
- **THEN** all UI text SHALL display in Simplified Chinese

#### Scenario: Application loads with saved language preference
- **WHEN** user opens the application
- **THEN** the system SHALL restore the previously selected language from localStorage
- **AND** display all UI text in that language

### Requirement: Translation keys coverage
All hardcoded UI text MUST be replaced with translation function calls.
Translation files MUST contain keys for all UI text in both Chinese and English.

#### Scenario: Developer adds new UI component with text
- **WHEN** a new component with user-facing text is created
- **THEN** the text MUST use the `useTranslations()` hook
- **AND** corresponding keys MUST exist in both `messages/zh.json` and `messages/en.json`

### Requirement: Exclusion of user content from i18n
The following content types SHALL NOT be translated:
- User input text (chat messages, note content)
- AI/LLM generated responses
- User-provided names (folder names, note titles)

#### Scenario: User views chat history
- **WHEN** user views their chat history
- **THEN** the chat message content SHALL be displayed as originally written/received
- **AND** only UI labels (like "Send", "Regenerate") SHALL be translated

### Requirement: Toast notifications internationalization
System toast notifications (success, error, info messages) MUST be translated based on selected language.

#### Scenario: Note saves successfully
- **WHEN** a note is saved successfully
- **THEN** the success toast message SHALL display in the user's selected language

#### Scenario: Operation fails
- **WHEN** an operation fails
- **THEN** the error toast message SHALL display in the user's selected language
