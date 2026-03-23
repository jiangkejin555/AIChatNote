## ADDED Requirements

### Requirement: User can register with email and password
The system SHALL allow new users to register using email and password combination.

#### Scenario: Successful registration
- **WHEN** user submits valid email and password (min 8 characters)
- **THEN** system creates a new user account
- **AND** system returns JWT token and refresh token
- **AND** system returns user information

#### Scenario: Duplicate email registration
- **WHEN** user submits an email that already exists
- **THEN** system returns 409 Conflict error
- **AND** error message indicates email is already registered

### Requirement: User can login with email and password
The system SHALL authenticate users with their registered email and password.

#### Scenario: Successful login
- **WHEN** user submits correct email and password
- **THEN** system returns JWT access token (24h validity)
- **AND** system returns refresh token (7d validity)
- **AND** system returns user information

#### Scenario: Invalid credentials
- **WHEN** user submits incorrect email or password
- **THEN** system returns 401 Unauthorized error
- **AND** error message does not reveal which field is incorrect

### Requirement: User can refresh access token
The system SHALL allow users to obtain a new access token using a valid refresh token.

#### Scenario: Successful token refresh
- **WHEN** user submits valid refresh token
- **THEN** system returns new access token
- **AND** system returns new refresh token
- **AND** old refresh token is invalidated

#### Scenario: Invalid refresh token
- **WHEN** user submits invalid or expired refresh token
- **THEN** system returns 401 Unauthorized error
- **AND** user must login again

### Requirement: User can logout
The system SHALL invalidate user tokens on logout.

#### Scenario: Successful logout
- **WHEN** authenticated user requests logout
- **THEN** system invalidates current refresh token
- **AND** system returns success message

### Requirement: User can get current user info
The system SHALL return the currently authenticated user's information.

#### Scenario: Get current user
- **WHEN** authenticated user requests /auth/me
- **THEN** system returns user id, email, and timestamps

#### Scenario: Unauthenticated access
- **WHEN** request lacks valid Authorization header
- **THEN** system returns 401 Unauthorized error

### Requirement: Passwords must be securely stored
The system SHALL hash passwords using bcrypt with cost factor 12.

#### Scenario: Password hashing
- **WHEN** user registers or changes password
- **THEN** system stores only the bcrypt hash
- **AND** original password is never stored or logged
