## ADDED Requirements

### Requirement: AI messages display model attribution
The system SHALL display the source model information for each AI assistant message. The format MUST be "Provider/Model" (e.g., "OpenAI/GPT-4o", "Anthropic/Claude Sonnet 4").

#### Scenario: Display model on AI message
- **WHEN** an AI assistant message is displayed
- **THEN** the message footer shows the model name in "Provider/Model" format
- **AND** the model name is displayed next to the timestamp

#### Scenario: Model deleted but message exists
- **WHEN** an AI message's model has been deleted from the system
- **BUT** the message has a model_id snapshot (e.g., "gpt-4o")
- **THEN** system displays the model_id snapshot with strikethrough or muted styling
- **AND** shows provider name as "Unknown" if not available

### Requirement: User messages do not show model
The system SHALL NOT display model attribution for user messages.

#### Scenario: User message display
- **WHEN** a user message is displayed
- **THEN** no model information is shown
- **AND** only timestamp is displayed in the message footer
