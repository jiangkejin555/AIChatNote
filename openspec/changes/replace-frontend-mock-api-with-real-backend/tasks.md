# Tasks: Replace Frontend Mock API with Real Backend API

## 1. Preparation

- [ ] 1.1 Verify backend API is running and accessible at `http://localhost:8080`
- [ ] 1.2 Test backend health endpoint `GET /health`
- [ ] 1.3 Create a test user account for manual testing

## 2. Tags API Module (Simplest)

- [x] 2.1 Set `USE_MOCK = false` in `frontend/src/lib/api/tags.ts`
- [x] 2.2 Adapt response format: extract `response.data.data` to return array
- [ ] 2.3 Test tags list loading in UI
- [ ] 2.4 Verify tag cloud displays correctly

## 3. Folders API Module

- [x] 3.1 Set `USE_MOCK = false` in `frontend/src/lib/api/folders.ts`
- [x] 3.2 Adapt `getAll()` response format: `{ data: [...] }`
- [x] 3.3 Adapt `getById()` response format: `{ data: {...} }`
- [x] 3.4 Adapt `create()` response format: `{ data: {...} }`
- [x] 3.5 Adapt `update()` response format: `{ data: {...} }`
- [x] 3.6 Adapt `copyFolder()` response format: `{ data: {...} }`
- [ ] 3.7 Test folder CRUD operations in UI
- [ ] 3.8 Verify folder tree displays correctly

## 4. Providers API Module

- [x] 4.1 Set `USE_MOCK = false` in `frontend/src/lib/api/providers.ts`
- [x] 4.2 Adapt `getById()` response format: `{ data: {...} }` → unwrap
- [x] 4.3 Adapt `getAvailableModels()`: convert `is_predefined` to `isPredefined`
- [x] 4.4 Verify all other methods work with existing response handling
- [ ] 4.5 Test provider CRUD operations in settings page
- [ ] 4.6 Test provider connection test feature
- [ ] 4.7 Test available models fetching

## 5. Provider Models API (in providers.ts)

- [x] 5.1 Verify `getAll()` returns `{ models: [...] }` correctly
- [x] 5.2 Verify `add()` returns `{ model: {...} }` correctly
- [x] 5.3 Verify `update()` returns `{ model: {...} }` correctly
- [x] 5.4 Verify `batchAdd()` returns `{ models: [...] }` correctly
- [ ] 5.5 Test adding models to provider
- [ ] 5.6 Test model enable/disable toggle
- [ ] 5.7 Test setting default model

## 6. Notes API Module

- [x] 6.1 Set `USE_MOCK = false` in `frontend/src/lib/api/notes.ts`
- [x] 6.2 Adapt `getAll()`: handle paginated response `{ data: [...], total, page, page_size }`
- [x] 6.3 Adapt `getById()`: unwrap `{ data: {...} }` and convert tags format
- [x] 6.4 Implement tags format conversion: `NoteTag[]` → `string[]`
- [x] 6.5 Adapt `create()`: unwrap `{ data: {...} }` and convert tags
- [x] 6.6 Adapt `update()`: unwrap `{ data: {...} }` and convert tags
- [x] 6.7 Adapt `generate()`: unwrap response and handle format
- [x] 6.8 Adapt `importMarkdown()`: unwrap `{ data: {...} }` and convert tags
- [x] 6.9 Adapt `copyNote()`: unwrap `{ data: {...} }` and convert tags
- [x] 6.10 Adapt `batchMoveNotes()`: use `target_folder_id` in request body
- [ ] 6.11 Test notes list loading
- [ ] 6.12 Test note creation and editing
- [ ] 6.13 Test note tags display and filtering
- [ ] 6.14 Test markdown import feature
- [ ] 6.15 Test note copy feature
- [ ] 6.16 Test batch operations (delete, move)

## 7. Conversations API Module

- [x] 7.1 Set `USE_MOCK = false` in `frontend/src/lib/api/conversations.ts`
- [x] 7.2 Adapt `getAll()`: handle paginated response
- [x] 7.3 Adapt `getById()`: unwrap `{ data: { ...conversation, messages: [...] } }`
- [x] 7.4 Adapt `getMessages()`: unwrap `{ data: [...] }`
- [x] 7.5 Adapt `create()`: unwrap `{ data: {...} }`
- [x] 7.6 Adapt `update()`: unwrap `{ data: {...} }`
- [x] 7.7 Adapt `markAsSaved()`: unwrap `{ data: {...} }`
- [x] 7.8 Modify `sendMessage()`: add `stream: false` to request
- [x] 7.9 Modify `regenerate()`: add `stream: false` to request
- [x] 7.10 Adapt response unwrapping for non-stream responses
- [ ] 7.11 Test conversation list loading
- [ ] 7.12 Test conversation creation
- [ ] 7.13 Test sending messages (non-stream)
- [ ] 7.14 Test message regeneration
- [ ] 7.15 Test save to note feature

## 8. Cleanup

- [x] 8.1 Remove unused mock imports from all API files
- [ ] 8.2 Delete or archive `frontend/src/lib/api/mock-data.ts`
- [x] 8.3 Remove `USE_MOCK` constants (no longer needed)
- [ ] 8.4 Update any remaining mock references in codebase

## 9. Testing & Verification

- [ ] 9.1 Full end-to-end test: User registration and login
- [ ] 9.2 Full end-to-end test: Provider setup and model configuration
- [ ] 9.3 Full end-to-end test: Create and run a conversation
- [ ] 9.4 Full end-to-end test: Save conversation to note
- [ ] 9.5 Full end-to-end test: Note CRUD with tags and folders
- [ ] 9.6 Verify data persistence (refresh page, data still exists)
- [ ] 9.7 Test error handling (network errors, API errors)

## 10. Documentation

- [ ] 10.1 Update README with backend API requirements
- [ ] 10.2 Document environment variable `NEXT_PUBLIC_API_URL`
- [ ] 10.3 Update development setup guide
