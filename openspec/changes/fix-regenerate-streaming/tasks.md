## 1. Backend: FK Cleanup

- [x] 1.1 Add `ClearAssistantMessageID` method to `MessageRequestRepository` — sets `assistant_message_id = NULL` where it matches a given message ID
- [x] 1.2 Add test for `ClearAssistantMessageID` in `message_request_test.go`

## 2. Backend: Extract Shared Streaming Logic

- [x] 2.1 Extract `buildContextMessages` helper — shared context building logic from SendMessage into a reusable method (respects user settings: simple/summary mode)
- [x] 2.2 Refactor `SendMessage` to call `buildContextMessages` instead of inline context building
- [x] 2.3 Verify existing `SendMessage` tests still pass (pre-existing failures unrelated to changes)

## 3. Backend: Refactor Regenerate Handler
- [x] 3.1 In `Regenerate`: call `ClearAssistantMessageID` before deleting the old assistant message
- [x] 3.2 In `Regenerate`: delete the old assistant message, then fetch remaining messages for context
- [x] 3.3 In `Regenerate`: generate a new `request_id`, create a `MessageRequest`, delegate to `handleStreamResponse` via `buildContextMessages` + `handleStreamResponse`
- [x] 3.4 Add test for regenerate with FK cleanup — verify `assistant_message_id` cleared and old message deleted
- [x] 3.5 Add tests for regenerate: invalid ID, non-existent conversation, model_deleted error

## 4. Frontend: Switch Regenerate to SSE Streaming
- [x] 4.1 Update `regenerate` API function in `conversations.ts` to send request with `Accept: text/event-stream` and `stream: true`
- [x] 4.2 Rewrite `useRegenerateMessage` hook in `use-conversations.ts` to use SSE stream parsing (reusing logic from `use-stream-chat`)
- [x] 4.3 Update `message-item.tsx` regenerate button handler to work with the new streaming hook. Regenerate button shows on last assistant message including cancelled ones (`canceled=true`), but not during streaming or timeout
- [x] 4.4 Regenerate 流式响应 correctly sets streaming state: `isCancelled: false`, `baseMessageCount`, `isThinking: true`, `isTimeout: false`

## 5. Integration Testing
- [x] 5.1 Backend unit tests pass: FK cleanup, message deletion, error cases
- [x] 5.2 Frontend TypeScript compiles cleanly
- [x] 5.3 Backend Go compiles cleanly
