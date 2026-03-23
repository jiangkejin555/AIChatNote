## ADDED Requirements

### Requirement: User can add model to provider
The system SHALL allow users to enable specific models for a provider.

#### Scenario: Add single model
- **WHEN** user submits model_id and optional display_name
- **THEN** system creates provider_model record
- **AND** model is linked to the provider

#### Scenario: Duplicate model
- **WHEN** user adds a model_id that already exists for this provider
- **THEN** system returns 409 Conflict error

### Requirement: User can batch add models
The system SHALL allow users to add multiple models at once.

#### Scenario: Batch add with default
- **WHEN** user submits array of models and specifies default_model_id
- **THEN** system creates all models
- **AND** specified model has is_default set to true
- **AND** other models have is_default set to false

### Requirement: User can update model settings
The system SHALL allow users to modify model configuration.

#### Scenario: Set default model
- **WHEN** user sets is_default=true for a model
- **THEN** system sets is_default=false for all other models in same provider
- **AND** only one model per provider can be default

#### Scenario: Disable model
- **WHEN** user sets enabled=false
- **THEN** model no longer appears in model selector
- **AND** existing conversations keep their model reference

### Requirement: User can delete model
The system SHALL allow users to remove a model from provider.

#### Scenario: Delete model
- **WHEN** user deletes a provider_model
- **THEN** system removes the record
- **AND** conversations using this model have provider_model_id set to null

### Requirement: Default model constraint
The system SHALL ensure at most one default model per provider.

#### Scenario: Database trigger
- **WHEN** a model is set as default
- **THEN** database trigger automatically sets other models to non-default
- **AND** this constraint is enforced at database level
