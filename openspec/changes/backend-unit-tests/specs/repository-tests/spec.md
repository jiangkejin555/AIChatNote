## ADDED Requirements

### Requirement: User repository tests
The UserRepository SHALL have tests for all CRUD operations.

#### Scenario: Create user
- **WHEN** Create is called with a new user
- **THEN** the user is saved to the database
- **AND** the user ID is populated

#### Scenario: Find user by email - exists
- **WHEN** FindByEmail is called with an existing email
- **THEN** the user record is returned
- **AND** no error is returned

#### Scenario: Find user by email - not exists
- **WHEN** FindByEmail is called with a non-existing email
- **THEN** an error is returned

#### Scenario: Find user by ID - exists
- **WHEN** FindByID is called with an existing ID
- **THEN** the user record is returned
- **AND** no error is returned

#### Scenario: Find user by ID - not exists
- **WHEN** FindByID is called with a non-existing ID
- **THEN** an error is returned

### Requirement: Conversation repository tests
The ConversationRepository SHALL have tests for all operations including message loading.

#### Scenario: Create conversation
- **WHEN** Create is called with a new conversation
- **THEN** the conversation is saved with a generated ID

#### Scenario: Find conversations by user ID
- **WHEN** FindByUserID is called with a user ID
- **THEN** all conversations belonging to that user are returned

#### Scenario: Find conversation with messages
- **WHEN** FindByIDWithMessages is called with a conversation ID
- **THEN** the conversation is returned with all messages loaded
- **AND** messages are ordered by creation time

#### Scenario: Find conversation by ID and user ID
- **WHEN** FindByIDAndUserID is called
- **THEN** the conversation is returned only if it belongs to the user

#### Scenario: Delete conversation
- **WHEN** Delete is called with a conversation ID and user ID
- **THEN** the conversation is deleted
- **AND** only the owner can delete

### Requirement: Note repository tests
The NoteRepository SHALL have tests for all operations including filtering and batch operations.

#### Scenario: Create note
- **WHEN** Create is called with a new note
- **THEN** the note is saved with a generated ID

#### Scenario: Find notes with filters
- **WHEN** FindByUserID is called with folder_id filter
- **THEN** only notes in that folder are returned

#### Scenario: Find notes with tag filter
- **WHEN** FindByUserID is called with tag filter
- **THEN** only notes with that tag are returned

#### Scenario: Find notes with search
- **WHEN** FindByUserID is called with search query
- **THEN** notes matching in title or content are returned

#### Scenario: Batch delete notes
- **WHEN** BatchDelete is called with multiple note IDs
- **THEN** all specified notes are deleted
- **AND** only notes belonging to the user are deleted

#### Scenario: Batch move notes
- **WHEN** BatchMove is called with note IDs and target folder
- **THEN** all specified notes are moved to the target folder

#### Scenario: Manage note tags
- **WHEN** CreateTags and DeleteTags are called
- **THEN** tags are correctly added and removed

### Requirement: Provider repository tests
The ProviderRepository SHALL have tests for API key storage and retrieval.

#### Scenario: Create provider with encrypted API key
- **WHEN** Create is called with an encrypted API key
- **THEN** the provider is saved correctly

#### Scenario: Find providers by user
- **WHEN** FindByUserID is called
- **THEN** all providers for that user are returned

#### Scenario: Delete provider
- **WHEN** Delete is called with a provider ID
- **THEN** the provider and its models are deleted (cascade)
