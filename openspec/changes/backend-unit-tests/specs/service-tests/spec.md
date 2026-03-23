## ADDED Requirements

### Requirement: AI service tests
The AIService SHALL have tests for note generation functionality.

#### Scenario: Generate note with mock mode enabled
- **WHEN** GenerateNoteFromConversation is called with mockEnabled=true
- **THEN** a mock GeneratedNote is returned
- **AND** the title equals "AI 对话总结 (Mock)"
- **AND** the tags contain "mock"
- **AND** no external API call is made

#### Scenario: Generate note with non-existing conversation
- **WHEN** GenerateNoteFromConversation is called with non-existing conversation ID
- **THEN** an error is returned
- **AND** the error message indicates conversation not found

#### Scenario: Generate note with wrong user
- **WHEN** GenerateNoteFromConversation is called with another user's conversation ID
- **THEN** an error is returned
- **AND** the error message indicates unauthorized access

#### Scenario: Parse AI response with JSON code block
- **WHEN** parseAIResponse is called with JSON in markdown code block
- **THEN** the GeneratedNote is correctly parsed

#### Scenario: Parse AI response with plain JSON
- **WHEN** parseAIResponse is called with plain JSON
- **THEN** the GeneratedNote is correctly parsed

#### Scenario: Extract JSON from markdown
- **WHEN** extractJSON is called with ```json...``` content
- **THEN** only the JSON content is returned
