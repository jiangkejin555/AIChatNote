## 1. Backend Data Model

- [x] 1.1 Add `provider_model_id` and `model_id` fields to Message model
- [x] 1.2 Rename Conversation `provider_model_id` to `current_provider_model_id`
- [x] 1.3 Create database migration script
- [x] 1.4 Update conversation and message repositories

## 2. Backend API

- [x] 2.1 Add PUT /api/conversations/:id/model endpoint for model switching
- [x] 2.2 Update SendMessage handler to save model info on assistant messages
- [x] 2.3 Update conversation creation to use new field name
- [x] 2.4 Update model deletion handler to set conversation's current_provider_model_id to null

## 3. Frontend Types

- [x] 3.1 Update Conversation type: rename `provider_model_id` to `current_provider_model_id`
- [x] 3.2 Update Message type: add `provider_model_id` and `model_id` fields
- [x] 3.3 Update CreateConversationRequest type

## 4. Frontend Model Switching

- [x] 4.1 Create ModelSwitchConfirmDialog component
- [x] 4.2 Update ModelSelector to show confirm dialog when switching in existing conversation
- [x] 4.3 Add API call for updating conversation model
- [x] 4.4 Handle model deleted state: show warning and prompt selection

## 5. Frontend Message Attribution

- [x] 5.1 Update MessageItem to display model attribution for assistant messages
- [x] 5.2 Add styling for model name display (Provider/Model format)
- [x] 5.3 Handle deleted model display (show model_id snapshot with muted styling)

## 6. Testing

- [ ] 6.1 Backend unit tests for new API endpoint
- [ ] 6.2 Backend unit tests for message model attribution
- [ ] 6.3 Frontend tests for model switch confirmation flow
- [ ] 6.4 Integration tests for full model switching flow
