## 1. Project Setup

- [x] 1.1 Initialize Go module in backend/ directory
- [x] 1.2 Create project directory structure (cmd, internal, migrations)
- [x] 1.3 Create docker-compose.yml with PostgreSQL service
- [x] 1.4 Create .env.example with all environment variables
- [x] 1.5 Implement config loading from environment variables

## 2. Database Layer

- [x] 2.1 Create database connection with GORM
- [x] 2.2 Create User model with GORM annotations
- [x] 2.3 Create Provider and ProviderModel models
- [x] 2.4 Create Conversation and Message models
- [x] 2.5 Create Note, Folder, NoteTag models
- [x] 2.6 Create RefreshToken model
- [x] 2.7 Create database migration SQL script
- [x] 2.8 Add full-text search trigger for notes table

## 3. Security & Crypto

- [x] 3.1 Implement AES-256-GCM encryption module
- [x] 3.2 Implement bcrypt password hashing
- [x] 3.3 Implement JWT token generation and validation
- [x] 3.4 Implement Refresh Token generation and validation

## 4. Middleware

- [x] 4.1 Implement Auth middleware (JWT validation)
- [x] 4.2 Implement CORS middleware
- [x] 4.3 Implement request logging middleware
- [x] 4.4 Implement error recovery middleware

## 5. Authentication APIs

- [x] 5.1 Implement user registration endpoint
- [x] 5.2 Implement user login endpoint
- [x] 5.3 Implement token refresh endpoint
- [x] 5.4 Implement logout endpoint
- [x] 5.5 Implement get current user endpoint

## 6. Provider Management APIs

- [x] 6.1 Create provider repository (CRUD operations)
- [x] 6.2 Implement list providers endpoint
- [x] 6.3 Implement create provider endpoint (with encryption)
- [x] 6.4 Implement get provider endpoint
- [x] 6.5 Implement update provider endpoint
- [x] 6.6 Implement delete provider endpoint
- [x] 6.7 Implement fetch available models endpoint
- [x] 6.8 Implement test connection endpoint

## 7. Provider Model Management APIs

- [x] 7.1 Create provider model repository
- [x] 7.2 Implement list provider models endpoint
- [x] 7.3 Implement add provider model endpoint
- [x] 7.4 Implement update provider model endpoint
- [x] 7.5 Implement delete provider model endpoint
- [x] 7.6 Implement batch add models endpoint
- [x] 7.7 Implement set default model endpoint

## 8. Conversation System APIs

- [x] 8.1 Create conversation and message repositories
- [x] 8.2 Implement list conversations endpoint
- [x] 8.3 Implement create conversation endpoint
- [x] 8.4 Implement get conversation detail endpoint
- [x] 8.5 Implement update conversation endpoint
- [x] 8.6 Implement delete conversation endpoint
- [x] 8.7 Implement mark conversation as saved endpoint
- [x] 8.8 Implement get messages endpoint (with pagination)

## 9. Streaming Chat

- [x] 9.1 Create LLM service with go-openai client
- [x] 9.2 Implement send message endpoint (non-streaming)
- [x] 9.3 Implement SSE streaming response
- [x] 9.4 Implement message persistence after streaming
- [x] 9.5 Implement regenerate response endpoint
- [x] 9.6 Handle LLM API errors gracefully

## 10. Note Management APIs

- [x] 10.1 Create note repository
- [x] 10.2 Implement list notes endpoint (with filters)
- [x] 10.3 Implement create note endpoint
- [x] 10.4 Implement get note detail endpoint
- [x] 10.5 Implement update note endpoint
- [x] 10.6 Implement delete note endpoint
- [x] 10.7 Implement copy note endpoint
- [x] 10.8 Implement batch delete notes endpoint
- [x] 10.9 Implement batch move notes endpoint

## 11. AI Note Generation

- [x] 11.1 Create DeepSeek client configuration
- [x] 11.2 Implement summary prompt template
- [x] 11.3 Implement generate note preview endpoint
- [x] 11.4 Parse JSON response from DeepSeek

## 12. Folder Management APIs

- [x] 12.1 Create folder repository
- [x] 12.2 Implement list folders endpoint (tree structure)
- [x] 12.3 Implement create folder endpoint
- [x] 12.4 Implement update folder endpoint
- [x] 12.5 Implement delete folder endpoint
- [x] 12.6 Implement copy folder endpoint

## 13. Tag Management APIs

- [x] 13.1 Implement list tags with counts endpoint

## 14. Search & Export/Import APIs

- [x] 14.1 Implement full-text search in notes list
- [x] 14.2 Implement export single note endpoint (Markdown)
- [x] 14.3 Implement batch export notes endpoint (ZIP)
- [x] 14.4 Implement import Markdown file endpoint

## 15. Final Setup

- [x] 15.1 Create main.go with router setup
- [x] 15.2 Add health check endpoint
- [x] 15.3 Create Dockerfile for production
- [ ] 15.4 Test all endpoints with frontend
