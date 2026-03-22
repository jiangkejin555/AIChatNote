# Model Management Specification

## ADDED Requirements

### Requirement: User can view configured models

The system SHALL display a list of all configured LLM models for the current user.

#### Scenario: Display model list
- **WHEN** user navigates to settings/models page
- **THEN** system displays all configured models with name, API base, model name, and default status

#### Scenario: Empty model list
- **WHEN** user has no configured models
- **THEN** system displays empty state with prompt to add first model

### Requirement: User can add a new model

The system SHALL allow users to configure new LLM models.

#### Scenario: Add model successfully
- **WHEN** user submits valid model configuration (name, API base, API key, model name)
- **THEN** system saves model to database
- **THEN** model appears in model list
- **THEN** success toast is displayed

#### Scenario: Add model as default
- **WHEN** user checks "设为默认" when adding model
- **THEN** new model is set as default
- **THEN** previous default model is unset

### Requirement: User can edit existing model

The system SHALL allow users to modify model configurations.

#### Scenario: Edit model successfully
- **WHEN** user updates model configuration and saves
- **THEN** system updates model in database
- **THEN** model list reflects changes

#### Scenario: API key masked in edit form
- **WHEN** user opens edit form
- **THEN** API key field shows masked value (e.g., "sk-***xxx")
- **THEN** leaving field unchanged preserves existing key

### Requirement: User can delete a model

The system SHALL allow users to remove model configurations.

#### Scenario: Delete model with confirmation
- **WHEN** user clicks delete and confirms
- **THEN** system removes model from database
- **THEN** model no longer appears in list

#### Scenario: Delete default model
- **WHEN** user deletes the default model
- **THEN** system sets another model as default (if available)
- **THEN** if no other models exist, no default is set

### Requirement: User can set default model

The system SHALL allow users to designate a default model for new conversations.

#### Scenario: Set model as default
- **WHEN** user clicks "设为默认" on a model
- **THEN** system updates default model
- **THEN** previous default model is unset
- **THEN** UI reflects new default status
