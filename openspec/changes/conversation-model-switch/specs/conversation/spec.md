## ADDED Requirements

### Requirement: Conversation tracks current model
The system SHALL maintain a `current_provider_model_id` field on each conversation that indicates the model currently being used for new messages.

#### Scenario: Create new conversation with model
- **WHEN** user creates a new conversation with a selected model
- **THEN** conversation's `current_provider_model_id` is set to the selected model

#### Scenario: Update conversation model on switch
- **WHEN** user switches model in an existing conversation
- **AND** confirms the switch
- **THEN** conversation's `current_provider_model_id` is updated to the new model

### Requirement: Message stores model attribution
The system SHALL store `provider_model_id` on each assistant message to track which model generated it.

#### Scenario: Save AI message with model
- **WHEN** an AI assistant message is saved
- **THEN** message's `provider_model_id` is set to the model used for generation
- **AND** message's `model_id` snapshot is set (e.g., "gpt-4o") for display when model is deleted

#### Scenario: Save user message without model
- **WHEN** a user message is saved
- **THEN** message's `provider_model_id` is null
- **AND** message's `model_id` is null

### Requirement: Send message uses current model
The system SHALL use the conversation's `current_provider_model_id` when sending new messages to the LLM.

#### Scenario: Send message with current model
- **WHEN** user sends a message in a conversation
- **THEN** system uses the conversation's `current_provider_model_id` to determine which model to use
- **AND** if `current_provider_model_id` is null (model deleted and not yet replaced), system shows error

### Requirement: Conversation model can be null
The system SHALL allow `current_provider_model_id` to be null when the model is deleted.

#### Scenario: Model deleted sets null
- **WHEN** a provider model is deleted
- **THEN** all conversations using that model have their `current_provider_model_id` set to null
- **AND** conversation's `model_id` snapshot is preserved
