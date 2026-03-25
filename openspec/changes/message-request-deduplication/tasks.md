## 1. Database Migration

- [x] 1.1 Create migration file for `message_requests` table
- [x] 1.2 Run migration and verify table creation

## 2. Backend Model & Repository

- [x] 2.1 Create `MessageRequest` model in `backend/internal/models/`
- [x] 2.2 Create `MessageRequestRepository` in `backend/internal/repository/`
- [x] 2.3 Add methods: `CreateIfNotExists`, `FindByRequestID`, `UpdateStatus`, `SetCompleted`

## 3. Backend Handler

- [x] 3.1 Modify `SendMessageRequest` struct to accept `request_id` parameter
- [x] 3.2 Add deduplication logic in `SendMessage` handler
- [x] 3.3 Handle `processing` status case (return in-progress message)
- [x] 3.4 Handle `completed` status case (return existing message)
- [x] 3.5 Update request status to `completed` after AI response saved

## 4. Frontend Request ID Generation

- [x] 4.1 Modify `use-stream-chat.ts` to accept and pass `request_id`
- [x] 4.2 Generate `request_id` using `crypto.randomUUID()` in `page.tsx`
- [x] 4.3 Store `request_id` in ref for retry reuse
- [x] 4.4 Pass same `request_id` on retry

## 5. Testing

- [x] 5.1 Add unit tests for `MessageRequestRepository`
- [x] 5.2 Add integration tests for deduplication logic
- [x] 5.3 Test retry scenario returns existing message
- [x] 5.4 Test concurrent requests with same `request_id`

## 6. Documentation

- [x] 6.1 Update API documentation with `request_id` parameter
