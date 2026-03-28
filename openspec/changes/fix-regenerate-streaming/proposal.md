## Why

The current Regenerate endpoint has a critical FK constraint bug (crashes when `message_requests` references the message being deleted), uses non-streaming responses (poor UX), ignores user context settings, and lacks request deduplication. These issues make the retry experience broken and inferior to the normal send-message flow.

## What Changes

- Fix FK constraint violation: clear `message_requests.assistant_message_id` before deleting the old assistant message
- Replace non-streaming response with SSE streaming, reusing the SendMessage streaming logic
- Reuse SendMessage's context building (respect user's simple/summary mode settings)
- Add MessageRequest deduplication to the regenerate flow
- Frontend: switch regenerate API call from JSON response to SSE stream handling

## Capabilities

### New Capabilities

- `message-regenerate`: Covers the regenerate-last-message flow — deleting the old assistant message (with FK cleanup) and streaming a new response via the SendMessage pipeline

### Modified Capabilities

## Impact

- **Backend**: `ConversationHandler.Regenerate` in `internal/handlers/conversation.go` — major refactor to reuse SendMessage streaming logic
- **Backend**: `MessageRequestRepository` — may need a method to clear `assistant_message_id` for a given message
- **Frontend**: `useRegenerateMessage` hook in `use-conversations.ts` — switch from React Query mutation to SSE stream handling
- **Frontend**: `conversations.ts` API module — update regenerate call to handle SSE
- **API**: `POST /api/conversations/:id/messages/:messageId/regenerate` — response changes from JSON to SSE stream
