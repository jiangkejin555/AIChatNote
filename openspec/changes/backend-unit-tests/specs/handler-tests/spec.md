## ADDED Requirements

### Requirement: Auth handler tests
The AuthHandler SHALL have tests for all authentication endpoints.

#### Scenario: Register with valid credentials
- **WHEN** POST /api/auth/register is called with valid email and password
- **THEN** HTTP 201 is returned
- **AND** response contains token, refresh_token, and user object

#### Scenario: Register with invalid email
- **WHEN** POST /api/auth/register is called with invalid email format
- **THEN** HTTP 400 is returned
- **AND** response contains error message

#### Scenario: Register with short password
- **WHEN** POST /api/auth/register is called with password < 8 characters
- **THEN** HTTP 400 is returned

#### Scenario: Register with duplicate email
- **WHEN** POST /api/auth/register is called with existing email
- **THEN** HTTP 409 is returned

#### Scenario: Login with correct credentials
- **WHEN** POST /api/auth/login is called with correct email and password
- **THEN** HTTP 200 is returned
- **AND** response contains valid token

#### Scenario: Login with wrong password
- **WHEN** POST /api/auth/login is called with wrong password
- **THEN** HTTP 401 is returned

#### Scenario: Login with non-existing email
- **WHEN** POST /api/auth/login is called with non-existing email
- **THEN** HTTP 401 is returned

#### Scenario: Refresh token
- **WHEN** POST /api/auth/refresh is called with valid refresh token
- **THEN** HTTP 200 is returned
- **AND** response contains new access token and new refresh token

#### Scenario: Get current user
- **WHEN** GET /api/auth/me is called with valid token
- **THEN** HTTP 200 is returned
- **AND** response contains current user info

#### Scenario: Get current user without token
- **WHEN** GET /api/auth/me is called without token
- **THEN** HTTP 401 is returned

### Requirement: Conversation handler tests
The ConversationHandler SHALL have tests for all conversation endpoints.

#### Scenario: List conversations
- **WHEN** GET /api/conversations is called
- **THEN** HTTP 200 is returned
- **AND** response contains array of conversations

#### Scenario: Create conversation
- **WHEN** POST /api/conversations is called
- **THEN** HTTP 201 is returned
- **AND** response contains new conversation

#### Scenario: Get conversation by ID
- **WHEN** GET /api/conversations/:id is called with valid ID
- **THEN** HTTP 200 is returned
- **AND** response contains conversation with messages

#### Scenario: Get conversation - forbidden
- **WHEN** GET /api/conversations/:id is called with another user's conversation ID
- **THEN** HTTP 403 is returned

#### Scenario: Update conversation
- **WHEN** PUT /api/conversations/:id is called
- **THEN** HTTP 200 is returned
- **AND** response contains updated conversation

#### Scenario: Delete conversation
- **WHEN** DELETE /api/conversations/:id is called
- **THEN** HTTP 200 is returned

#### Scenario: Send message - mock mode
- **WHEN** POST /api/conversations/:id/messages is called with mock mode enabled
- **THEN** HTTP 200 is returned
- **AND** response contains mock AI reply

### Requirement: Note handler tests
The NoteHandler SHALL have tests for all note endpoints.

#### Scenario: List notes
- **WHEN** GET /api/notes is called
- **THEN** HTTP 200 is returned
- **AND** response contains array of notes with tags

#### Scenario: List notes with filters
- **WHEN** GET /api/notes?folder_id=1&tag=work is called
- **THEN** HTTP 200 is returned
- **AND** response contains filtered notes

#### Scenario: Create note
- **WHEN** POST /api/notes is called with valid data
- **THEN** HTTP 201 is returned
- **AND** response contains new note with tags

#### Scenario: Create note with missing required field
- **WHEN** POST /api/notes is called without title
- **THEN** HTTP 400 is returned

#### Scenario: Get note by ID
- **WHEN** GET /api/notes/:id is called with valid ID
- **THEN** HTTP 200 is returned

#### Scenario: Update note
- **WHEN** PUT /api/notes/:id is called
- **THEN** HTTP 200 is returned

#### Scenario: Delete note
- **WHEN** DELETE /api/notes/:id is called
- **THEN** HTTP 200 is returned

#### Scenario: Copy note
- **WHEN** POST /api/notes/:id/copy is called
- **THEN** HTTP 200 is returned
- **AND** response contains a copy with title suffixed " - Copy"

#### Scenario: Export note as Markdown
- **WHEN** GET /api/notes/:id/export is called
- **THEN** HTTP 200 is returned
- **AND** Content-Type is text/markdown

#### Scenario: Batch delete notes
- **WHEN** POST /api/notes/batch-delete is called with note IDs
- **THEN** HTTP 200 is returned
- **AND** all specified notes are deleted

#### Scenario: Batch move notes
- **WHEN** POST /api/notes/batch-move is called with note IDs and folder
- **THEN** HTTP 200 is returned

### Requirement: Folder handler tests
The FolderHandler SHALL have tests for folder tree operations.

#### Scenario: List folders as tree
- **WHEN** GET /api/folders is called
- **THEN** HTTP 200 is returned
- **AND** response contains nested folder structure

#### Scenario: Create folder
- **WHEN** POST /api/folders is called
- **THEN** HTTP 201 is returned

#### Scenario: Create nested folder
- **WHEN** POST /api/folders is called with parent_id
- **THEN** a child folder is created

#### Scenario: Delete folder moves notes to root
- **WHEN** DELETE /api/folders/:id is called
- **THEN** folder is deleted
- **AND** notes in the folder are moved to root

### Requirement: Provider handler tests
The ProviderHandler SHALL have tests for provider management.

#### Scenario: List providers
- **WHEN** GET /api/providers is called
- **THEN** HTTP 200 is returned
- **AND** API keys are not exposed in response

#### Scenario: Create provider
- **WHEN** POST /api/providers is called with valid data
- **THEN** HTTP 201 is returned

#### Scenario: Update provider
- **WHEN** PUT /api/providers/:id is called
- **THEN** HTTP 200 is returned

#### Scenario: Delete provider
- **WHEN** DELETE /api/providers/:id is called
- **THEN** HTTP 200 is returned
