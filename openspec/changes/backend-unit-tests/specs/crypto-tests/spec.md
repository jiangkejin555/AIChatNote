## ADDED Requirements

### Requirement: Password hashing tests
The crypto password module SHALL have comprehensive tests for HashPassword and CheckPassword functions.

#### Scenario: Hash normal password
- **WHEN** HashPassword is called with a normal password string
- **THEN** a bcrypt hash string is returned
- **AND** no error is returned

#### Scenario: Hash empty password
- **WHEN** HashPassword is called with an empty string
- **THEN** a valid hash is returned (bcrypt allows empty passwords)
- **AND** no error is returned

#### Scenario: Hash unicode password
- **WHEN** HashPassword is called with unicode characters
- **THEN** a valid hash is returned
- **AND** no error is returned

#### Scenario: Verify correct password
- **WHEN** CheckPassword is called with the original password and its hash
- **THEN** true is returned

#### Scenario: Verify wrong password
- **WHEN** CheckPassword is called with a wrong password and a hash
- **THEN** false is returned

#### Scenario: Different hashes for same password
- **WHEN** HashPassword is called twice with the same password
- **THEN** two different hash strings are returned (due to bcrypt salt)

### Requirement: JWT token tests
The crypto JWT module SHALL have comprehensive tests for token generation and validation.

#### Scenario: Generate valid token
- **WHEN** GenerateToken is called with a valid user
- **THEN** a non-empty token string is returned
- **AND** no error is returned

#### Scenario: Validate valid token
- **WHEN** ValidateToken is called with a valid token
- **THEN** the Claims object is returned with correct user info
- **AND** no error is returned

#### Scenario: Validate expired token
- **WHEN** ValidateToken is called with an expired token
- **THEN** an error is returned

#### Scenario: Validate invalid token
- **WHEN** ValidateToken is called with an invalid token string
- **THEN** an error is returned

#### Scenario: Validate token with wrong secret
- **WHEN** ValidateToken is called with a token signed by a different secret
- **THEN** an error is returned

#### Scenario: Generate refresh token
- **WHEN** GenerateRefreshToken is called
- **THEN** a token string starting with "rt_" is returned
- **AND** a valid expiry time is returned

### Requirement: AES encryption tests
The crypto AES module SHALL have comprehensive tests for encryption and decryption.

#### Scenario: Encrypt normal text
- **WHEN** Encrypt is called with a non-empty plaintext
- **THEN** a string prefixed with "enc:" is returned
- **AND** no error is returned

#### Scenario: Encrypt empty string
- **WHEN** Encrypt is called with an empty string
- **THEN** an empty string is returned
- **AND** no error is returned

#### Scenario: Decrypt normal text
- **WHEN** Decrypt is called with a valid encrypted string
- **THEN** the original plaintext is returned
- **AND** no error is returned

#### Scenario: Decrypt empty string
- **WHEN** Decrypt is called with an empty string
- **THEN** an empty string is returned

#### Scenario: Decrypt without prefix
- **WHEN** Decrypt is called with a string without "enc:" prefix
- **THEN** the original string is returned (backward compatibility)

#### Scenario: Encrypt-decrypt round trip
- **WHEN** text is encrypted and then decrypted
- **THEN** the result equals the original text

#### Scenario: Different ciphertext for same plaintext
- **WHEN** Encrypt is called twice with the same plaintext
- **THEN** two different ciphertexts are returned (due to random nonce)
