## ADDED Requirements

### Requirement: User can create AI provider
The system SHALL allow users to add AI providers with their API credentials.

#### Scenario: Create provider with valid data
- **WHEN** user submits provider name, type, api_base, and api_key
- **THEN** system creates a new provider record
- **AND** api_key is encrypted using AES-256-GCM before storage
- **AND** system returns provider without exposing api_key

#### Scenario: Invalid provider type
- **WHEN** user submits an unsupported provider type
- **THEN** system returns 400 Bad Request
- **AND** error message lists valid provider types

### Requirement: User can list their providers
The system SHALL return all providers owned by the authenticated user.

#### Scenario: List providers
- **WHEN** authenticated user requests /providers
- **THEN** system returns array of providers
- **AND** each provider includes associated models
- **AND** api_key is not included in response

### Requirement: User can update provider
The system SHALL allow users to modify provider configuration.

#### Scenario: Update provider name or api_base
- **WHEN** user submits updated name or api_base
- **THEN** system updates the provider record
- **AND** updated_at timestamp is refreshed

#### Scenario: Update api_key
- **WHEN** user submits new api_key (non-empty)
- **THEN** system encrypts and stores the new key
- **AND** old key is replaced

#### Scenario: Keep existing api_key
- **WHEN** user submits empty or null api_key
- **THEN** system keeps existing encrypted api_key unchanged

### Requirement: User can delete provider
The system SHALL allow users to remove a provider and all its models.

#### Scenario: Delete provider
- **WHEN** user deletes a provider
- **THEN** system removes provider record
- **AND** system cascades delete all associated provider_models
- **AND** conversations using those models have provider_model_id set to null

### Requirement: User can test provider connection
The system SHALL verify that provider API credentials are valid.

#### Scenario: Successful connection test
- **WHEN** user requests connection test for a provider
- **THEN** system makes a minimal API call using the stored credentials
- **AND** system returns success status with latency measurement

#### Scenario: Failed connection test
- **WHEN** provider API returns authentication error
- **THEN** system returns failure status
- **AND** system provides helpful error message

### Requirement: User can fetch available models from provider
The system SHALL dynamically fetch available models from provider API.

#### Scenario: Fetch models from OpenAI-compatible API
- **WHEN** user requests available models for a provider
- **THEN** system calls the provider's /models endpoint
- **AND** system returns list of available model IDs and names

#### Scenario: Provider doesn't support models endpoint
- **WHEN** provider returns 404 or error for /models
- **THEN** system returns predefined model list for known providers
- **AND** is_predefined flag is set to true

### Requirement: API keys must be encrypted at rest
The system SHALL encrypt all stored API keys using AES-256-GCM.

#### Scenario: Encryption format
- **WHEN** api_key is stored
- **THEN** ciphertext format is "enc:" + base64(nonce + auth_tag + ciphertext)
- **AND** each encryption uses a random 12-byte nonce
