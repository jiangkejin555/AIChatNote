## 1. Backend Data Model

- [ ] 1.1 Add `provider_model_id` and `model_id` fields to Message model
- [ ] 1.2 Rename Conversation `provider_model_id` to `current_provider_model_id`
- [ ] 1.3 Create database migration script
- [ ] 1.4 Update conversation and message repositories

## 2. Backend API

- [ ] 2.1 Add PUT /api/conversations/:id/model endpoint for model switching
- [ ] 2.2 Update SendMessage handler to save model info on assistant messages
- [ ] 2.3 Update conversation creation to use new field name
- [ ] 2.4 Update model deletion handler to set conversation's current_provider_model_id to null

## 3. Frontend Types

- [ ] 3.1 Update Conversation type: rename `provider_model_id` to `current_provider_model_id`
- [ ] 3.2 Update Message type: add `provider_model_id` and `model_id` fields
- [ ] 3.3 Update CreateConversationRequest type

## 4. Frontend Model Switching

- [ ] 4.1 Create ModelSwitchConfirmDialog component
- [ ] 4.2 Update ModelSelector to show confirm dialog when switching in existing conversation
- [ ] 4.3 Add API call for updating conversation model
- [ ] 4.4 Handle model deleted state: show warning and prompt selection

## 5. Frontend Message Attribution

- [ ] 5.1 Update MessageItem to display model attribution for assistant messages
- [ ] 5.2 Add styling for model name display (Provider/Model format)
- [ ] 5.3 Handle deleted model display (show model_id snapshot with muted styling)

## 5. Testing

- [ ] 5.1 Backend unit tests for new API endpoint
- [ ] 5.2 Backend unit tests for message model attribution
- [ ] 5.3 Frontend tests for model switch confirmation flow
- [ ] 5.4 Integration tests for full model switching flow
