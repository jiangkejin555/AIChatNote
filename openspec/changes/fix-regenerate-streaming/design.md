## Context

The `Regenerate` endpoint (`POST /api/conversations/:id/messages/:messageId/regenerate`) currently operates as an independent non-streaming handler. It hard-deletes the assistant message and makes a synchronous LLM call. This causes:

1. **FK crash**: `message_requests.assistant_message_id` references the message being deleted → PostgreSQL rejects the DELETE
2. **Poor UX**: Non-streaming means users stare at a spinner until the full response is ready
3. **Inconsistent behavior**: Ignores user context settings (simple vs summary mode) and lacks deduplication that SendMessage has

The SendMessage handler already implements streaming, context building, and deduplication correctly. The regenerate flow should reuse that pipeline.

## Goals / Non-Goals

**Goals:**
- Fix the FK constraint crash
- Deliver streaming responses for regenerate, matching the send-message UX
- Reuse SendMessage's context building logic (simple/summary modes)
- Add deduplication protection for regenerate requests

**Non-Goals:**
- Branching/forking conversations (only retry the last assistant message)
- Retry during streaming or timeout states (only after message completes)
- Soft-delete or version history for regenerated messages
- Retry historical (non-last) messages

## Decisions

### 1. Refactor Regenerate to reuse SendMessage's streaming pipeline

**Decision**: The Regenerate handler will delete the old assistant message (with FK cleanup), then delegate to the same streaming logic used by SendMessage.

**Rationale**: Avoid duplicating context building, streaming, and deduplication code. SendMessage already handles all of this correctly.

**Implementation approach**: Extract the common streaming logic from `SendMessage` into a shared helper method (e.g., `buildContextAndStreamResponse`). Both `SendMessage` and `Regenerate` call this helper after their own setup.

**Alternative considered**: Frontend deletes message via DELETE API then calls SendMessage. Rejected because it requires two round-trips and the frontend would need to know the original user message content.

### 2. FK cleanup: NULLify `message_requests.assistant_message_id` before delete

**Decision**: Before deleting the assistant message, set `assistant_message_id = NULL` on any `message_requests` rows that reference it.

**Rationale**: The `message_requests` record may still be useful for audit/dedup purposes. NULLing the FK is safer than deleting the entire request record. The `assistant_message_id` field is already nullable (`*uint` in Go model).

### 3. Frontend switches from React Query mutation to SSE stream

**Decision**: The `useRegenerateMessage` hook will switch from a simple POST + JSON response to SSE stream handling, reusing the same stream parsing logic as `useStreamChat`.

**Rationale**: Users expect to see the regenerated response appear token-by-token, same as a normal send. Using the same SSE parsing keeps the frontend consistent.

### 4. Regenerate creates a new MessageRequest for deduplication

**Decision**: The regenerate endpoint will generate a new `request_id` (UUID) and create a `MessageRequest`, same as SendMessage.

**Rationale**: Protects against double-clicks and provides the same idempotency guarantees as normal message sending.

## Risks / Trade-offs

- **Behavioral change**: The API response changes from JSON to SSE. Any API consumers expecting JSON will break. → Mitigation: This is an internal API consumed only by the frontend, which we're updating simultaneously.
- **Hard delete preserved**: We're still hard-deleting the old assistant message rather than soft-deleting. The user cannot compare old vs new responses. → Acceptable per scope decision (user confirmed).
- **Extracted shared code**: Refactoring SendMessage to extract shared logic carries risk of breaking the existing send flow. → Mitigation: Existing tests for SendMessage must continue passing.
