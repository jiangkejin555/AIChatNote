# UI Theme Specification

## ADDED Requirements

### Requirement: User can switch between light and dark themes

The system SHALL support both light and dark color schemes.

#### Scenario: Switch to dark theme
- **WHEN** user clicks theme toggle button
- **THEN** UI switches to dark color scheme
- **THEN** preference is saved to localStorage
- **THEN** preference persists across page reloads

#### Scenario: Switch to light theme
- **WHEN** user clicks theme toggle button while in dark mode
- **THEN** UI switches to light color scheme
- **THEN** preference is saved to localStorage

#### Scenario: System preference detection
- **WHEN** user visits site for first time with system dark mode enabled
- **THEN** site uses dark theme by default

### Requirement: Layout is responsive

The system SHALL adapt layout for desktop and mobile devices.

#### Scenario: Desktop layout (width >= 768px)
- **WHEN** user views site on desktop
- **THEN** sidebar is always visible
- **THEN** main content area uses remaining width
- **THEN** multi-column layouts are used where appropriate

#### Scenario: Mobile layout (width < 768px)
- **WHEN** user views site on mobile
- **THEN** sidebar is hidden by default
- **THEN** hamburger menu toggle is visible
- **WHEN** user taps menu toggle
- **THEN** sidebar slides in as overlay
- **WHEN** user taps outside sidebar
- **THEN** sidebar closes

### Requirement: Loading states are displayed

The system SHALL provide visual feedback during loading operations.

#### Scenario: Page loading
- **WHEN** page content is loading
- **THEN** skeleton placeholders are displayed
- **THEN** loading completes with fade-in animation

#### Scenario: Button loading state
- **WHEN** user clicks action button that triggers async operation
- **THEN** button shows loading spinner
- **THEN** button is disabled during operation
- **WHEN** operation completes
- **THEN** button returns to normal state

### Requirement: Error states are handled gracefully

The system SHALL display appropriate error messages when operations fail.

#### Scenario: API error
- **WHEN** API request fails
- **THEN** error toast is displayed with user-friendly message
- **THEN** user can retry the operation

#### Scenario: Network error
- **WHEN** network is unavailable
- **THEN** "网络连接失败" message is displayed
- **THEN** retry option is provided

### Requirement: Sidebar can be collapsed (desktop)

The system SHALL allow users to collapse the sidebar on desktop.

#### Scenario: Collapse sidebar
- **WHEN** user clicks collapse button on desktop
- **THEN** sidebar collapses to icon-only view
- **THEN** main content area expands
- **THEN** preference is saved

#### Scenario: Expand sidebar
- **WHEN** user clicks expand button on collapsed sidebar
- **THEN** sidebar expands to full width
- **THEN** main content area shrinks

### Requirement: Keyboard navigation is supported

The system SHALL support keyboard navigation for accessibility.

#### Scenario: Navigate with keyboard
- **WHEN** user presses Tab
- **THEN** focus moves to next interactive element
- **THEN** focused element has visible focus indicator

#### Scenario: Submit form with Enter
- **WHEN** user presses Enter in single-line input field
- **THEN** form is submitted (if applicable)

#### Scenario: Send message with shortcut
- **WHEN** user presses Enter in chat input (not Shift+Enter)
- **THEN** message is sent
