# User Auth Specification

## ADDED Requirements

### Requirement: User can register with email and password

The system SHALL allow new users to register using email and password.

#### Scenario: Successful registration
- **WHEN** user submits valid email and password (min 8 characters)
- **THEN** system creates account and returns JWT token
- **THEN** user is redirected to home page

#### Scenario: Duplicate email
- **WHEN** user submits an already registered email
- **THEN** system displays "邮箱已被注册" error message

### Requirement: User can login with email and password

The system SHALL authenticate users with email and password.

#### Scenario: Successful login
- **WHEN** user submits correct credentials
- **THEN** system returns JWT token
- **THEN** token is stored in localStorage
- **THEN** user is redirected to home page or original destination

#### Scenario: Invalid credentials
- **WHEN** user submits incorrect email or password
- **THEN** system displays "邮箱或密码错误" error message

### Requirement: User can logout

The system SHALL allow users to logout and clear authentication state.

#### Scenario: Logout
- **WHEN** user clicks logout button
- **THEN** system clears token from localStorage
- **THEN** user is redirected to login page

### Requirement: Authentication state persists across page reloads

The system SHALL persist authentication state in localStorage.

#### Scenario: Page reload while authenticated
- **WHEN** user reloads page with valid token in localStorage
- **THEN** user remains logged in
- **THEN** no redirect to login page occurs

#### Scenario: Token expired
- **WHEN** API returns 401 Unauthorized
- **THEN** system clears authentication state
- **THEN** user is redirected to login page with redirect parameter

### Requirement: Protected routes require authentication

The system SHALL restrict access to protected routes to authenticated users only.

#### Scenario: Unauthenticated access to protected route
- **WHEN** unauthenticated user attempts to access protected route
- **THEN** user is redirected to login page
- **THEN** redirect parameter preserves original destination

#### Scenario: Authenticated user accesses login page
- **WHEN** authenticated user navigates to login or register page
- **THEN** user is redirected to home page
