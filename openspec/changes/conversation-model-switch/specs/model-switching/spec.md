## ADDED Requirements

### Requirement: User can switch model during conversation
The system SHALL allow users to switch the model in an existing conversation. When switching, the system MUST show a confirmation dialog explaining that the conversation history will be used by the new model.

#### Scenario: Switch model in existing conversation
- **WHEN** user clicks the model selector in an active conversation with history
- **AND** user selects a different model
- **THEN** system displays a confirmation dialog with message "Switching to [Model Name] will use the conversation history with the new model. Continue?"
- **AND** user can confirm or cancel

#### Scenario: Confirm model switch
- **WHEN** user confirms the model switch
- **THEN** system updates the conversation's current model
- **AND** subsequent messages use the new model
- **AND** confirmation dialog closes

#### Scenario: Cancel model switch
- **WHEN** user cancels the model switch
- **THEN** model selector reverts to previous selection
- **AND** no changes are made to the conversation

### Requirement: New conversation selects model directly
The system SHALL allow model selection in new conversations without confirmation.

#### Scenario: Select model for new conversation
- **WHEN** user is in a new conversation (no messages yet)
- **AND** user selects a model from the model selector
- **THEN** model is selected immediately without confirmation dialog

### Requirement: Model deleted prompt
The system SHALL prompt user to select a new model when the conversation's current model is deleted.

#### Scenario: Continue conversation after model deletion
- **WHEN** user opens a conversation whose model has been deleted
- **THEN** system displays a warning message "Current model has been deleted, please select a new model to continue"
- **AND** model selector is highlighted or focused
- **WHEN** user selects a new model
- **THEN** system updates the conversation's current model
- **AND** user can continue the conversation
