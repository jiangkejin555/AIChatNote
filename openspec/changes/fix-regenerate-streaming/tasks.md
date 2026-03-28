## 1. Backend: FK Cleanup

- [ ] 1.1 Add `ClearAssistantMessageID` method to `MessageRequestRepository` — sets `assistant_message_id = NULL` where it matches a given message ID
- [ ] 1.2 Add test for `ClearAssistantMessageID` in `message_request_test.go`

## 2. Backend: Extract Shared Streaming Logic

- [ ] 2.1 Extract the streaming + context building logic from `SendMessage` into a shared helper method (e.g., `streamResponse`) that accepts conversation, provider model, provider, messages, and writes SSE to Gin context
- [ ] 2.2 Refactor `SendMessage` to call the extracted helper
- [ ] 2.3 Verify existing `SendMessage` tests still pass

## 3. Backend: Refactor Regenerate Handler

- [ ] 3.1 In `Regenerate`: call `ClearAssistantMessageID` before deleting the old assistant message
- [ ] 3.2 In `Regenerate`: delete the old assistant message, then fetch the last user message
- [ ] 3.3 In `Regenerate`: generate a new `request_id`, create a `MessageRequest`, and delegate to the shared streaming helper
- [ ] 3.4 Add test for regenerate with FK cleanup — verify no FK violation when `message_requests` references the message
- [ ] 3.5 Add test for regenerate with streaming — verify SSE response format

## 4. Frontend: Switch Regenerate to SSE Streaming

- [ ] 4.1 Update `regenerate` API function in `conversations.ts` to send request with `Accept: text/event-stream` and `stream: true`
- [ ] 4.2 Refactor `useRegenerateMessage` hook in `use-conversations.ts` to use SSE stream parsing (reuse logic from `use-stream-chat`)
- [ ] 4.3 Update `message-item.tsx` regenerate button handler to work with the new streaming hook
- [ ] 4.4 Ensure regenerate button is only shown on the last completed assistant message (not during streaming/timeout)

## 5. Integration Testing

- [ ] 5.1 Test full flow: send message → get response → click regenerate → verify streaming response replaces old message
- [ ] 5.2 Test double-click regenerate → verify dedup returns 202 on second click
