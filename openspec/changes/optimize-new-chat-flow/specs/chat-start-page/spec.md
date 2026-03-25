## ADDED Requirements

### Requirement: Start page display when creating new chat

The system SHALL display a start page when the user clicks "New Chat" button and no conversation has been started yet.

#### Scenario: User clicks New Chat button
- **WHEN** user clicks "New Chat" button in sidebar
- **THEN** system displays start page with centered layout
- **THEN** system does NOT call backend API to create conversation
- **THEN** system sets `isPendingNewChat` state to `true`

#### Scenario: Start page layout
- **WHEN** start page is displayed
- **THEN** system shows model selector at top center
- **THEN** system shows welcome message below model selector
- **THEN** system shows centered input box at bottom

### Requirement: Welcome message internationalization

The system SHALL display welcome message in the user's selected language.

#### Scenario: Chinese welcome message
- **WHEN** user's language is Chinese (zh)
- **THEN** system displays "您好，请开始你的聊天 !"

#### Scenario: English welcome message
- **WHEN** user's language is English (en)
- **THEN** system displays "Hello, please start your chat."

### Requirement: Reuse pending start page

The system SHALL reuse the existing start page if user clicks "New Chat" while already on start page.

#### Scenario: Click New Chat while on start page
- **WHEN** `isPendingNewChat` is `true`
- **AND** user clicks "New Chat" button
- **THEN** system ignores the click
- **THEN** start page remains displayed
- **THEN** no new state changes occur

### Requirement: Start page theme support

The system SHALL support both light and dark themes for the start page.

#### Scenario: Dark mode display
- **WHEN** system is in dark mode
- **THEN** start page uses dark theme colors

#### Scenario: Light mode display
- **WHEN** system is in light mode
- **THEN** start page uses light theme colors
