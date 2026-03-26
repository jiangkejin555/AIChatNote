## 1. Database

- [x] 1.1 Create migration file `007_add_conversation_summaries.sql`
- [x] 1.2 Run migration to create `conversation_summaries` table

## 2. Models

- [x] 2.1 Create `ConversationSummary` model in `backend/internal/models/conversation_summary.go`
- [x] 2.2 Register model in database.go auto-migrate

## 3. Repository

- [x] 3.1 Create `SummaryRepository` in `backend/internal/repository/summary.go`
- [x] 3.2 Implement `FindByConversationID(conversationID uint) (*ConversationSummary, error)`
- [x] 3.3 Implement `Create(summary *ConversationSummary) error`
- [x] 3.4 Implement `Update(summary *ConversationSummary) error`
- [x] 3.5 Implement `Upsert(summary *ConversationSummary) error`

## 4. Summary Service

- [x] 4.1 Create `SummaryService` in `backend/internal/services/summary.go`
- [x] 4.2 Implement `buildSummaryPrompt(messages []Message, oldSummary string) string` with weighted grouping
- [x] 4.3 Implement `GenerateSummary(convID uint, messages []Message, oldSummary *ConversationSummary, client *openai.Client, model string) (string, error)`
- [x] 4.4 Implement `buildIncrementalSummaryPrompt(oldSummary string, newMessages []Message) string`

## 5. Conversation Handler

- [x] 5.1 Add `summaryService` to `ConversationHandler`
- [x] 5.2 Implement `shouldGenerateSummary(totalMessages int, summary *ConversationSummary) bool`
- [x] 5.3 Implement `buildContextMessages(convID uint) ([]openai.ChatCompletionMessage, error)`
- [x] 5.4 Modify `SendMessage` to use sliding window + summary logic
- [x] 5.5 Add fallback logic when summary generation fails

## 6. Testing

- [x] 6.1 Write unit tests for `SummaryRepository`
- [x] 6.2 Write unit tests for `SummaryService.buildSummaryPrompt`
- [x] 6.3 Write unit tests for `shouldGenerateSummary`
- [x] 6.4 Write integration test for full flow with mock LLM
