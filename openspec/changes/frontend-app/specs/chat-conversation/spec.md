# Chat Conversation Specification

## ADDED Requirements

### Requirement: User can create new conversation

The system SHALL allow users to start new chat conversations.

#### Scenario: Create conversation with selected model
- **WHEN** user clicks "新建对话"
- **THEN** system creates new conversation with default model
- **THEN** conversation appears in sidebar list
- **THEN** user is switched to new conversation

#### Scenario: Create conversation with specific model
- **WHEN** user selects a model then clicks "新建对话"
- **THEN** system creates conversation with selected model

### Requirement: User can view conversation list

The system SHALL display all user's conversations in sidebar.

#### Scenario: Display conversation list
- **WHEN** user is on home page
- **THEN** sidebar shows all conversations sorted by updated_at (newest first)
- **THEN** each conversation shows title (or "新对话" if untitled)

#### Scenario: Select conversation
- **WHEN** user clicks a conversation in sidebar
- **THEN** conversation loads with all messages
- **THEN** conversation is highlighted in sidebar

### Requirement: User can send messages with streaming response

The system SHALL allow users to send messages and receive streaming AI responses.

#### Scenario: Send message and receive streaming response
- **WHEN** user sends a message
- **THEN** user message appears immediately (optimistic update)
- **THEN** AI response streams in character by character
- **THEN** scroll follows to latest message

#### Scenario: Send message while AI is responding
- **WHEN** user sends message while AI is still generating
- **THEN** system queues the message
- **THEN** new message is sent after current response completes

### Requirement: User can copy message content

The system SHALL allow users to copy individual message content.

#### Scenario: Copy message
- **WHEN** user clicks copy button on a message
- **THEN** message content is copied to clipboard
- **THEN** success toast is displayed

### Requirement: User can regenerate AI response

The system SHALL allow users to regenerate the last AI response.

#### Scenario: Regenerate response
- **WHEN** user clicks "重新生成" on AI message
- **THEN** previous AI response is replaced
- **THEN** new response streams in

### Requirement: User can rename conversation

The system SHALL allow users to rename conversations.

#### Scenario: Rename conversation
- **WHEN** user clicks edit icon on conversation title
- **THEN** inline edit mode activates
- **WHEN** user saves new title
- **THEN** conversation title is updated in sidebar and header

### Requirement: User can delete conversation

The system SHALL allow users to delete conversations.

#### Scenario: Delete conversation
- **WHEN** user clicks delete on conversation and confirms
- **THEN** conversation is removed from database
- **THEN** conversation disappears from sidebar
- **THEN** if deleted conversation was active, switch to another or show empty state

### Requirement: User can save conversation as note

The system SHALL allow users to convert conversations to notes.

#### Scenario: Save as note
- **WHEN** user clicks "保存为笔记" button
- **THEN** save note dialog opens
- **THEN** AI generates suggested title, content, and tags
- **WHEN** user confirms save
- **THEN** note is created and conversation is marked as saved

### Requirement: Draft content is preserved

The system SHALL preserve input draft when switching conversations.

#### Scenario: Switch conversation with draft
- **WHEN** user types message but doesn't send
- **WHEN** user switches to another conversation
- **THEN** draft is saved for original conversation
- **WHEN** user switches back
- **THEN** draft is restored in input field
