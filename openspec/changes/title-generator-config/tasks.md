## 1. Config Structure

- [x] 1.1 Add `TitleGeneratorConfig` struct to `backend/internal/config/config.go`
- [x] 1.2 Add `TitleGenerator` field to main `Config` struct
- [x] 1.3 Add environment variable overrides for title generator in `applyEnvOverrides`

## 2. YAML Configuration

- [x] 2.1 Add `title_generator` section to `config.yaml` with default values

## 3. Handler Modification

- [x] 3.1 Modify `NewConversationHandler` to accept `*config.Config` parameter
- [x] 3.2 Store `TitleGeneratorConfig` in `ConversationHandler` struct
- [x] 3.3 Update all `NewConversationHandler` call sites to pass config

## 4. Title Generation Logic

- [x] 4.1 Refactor `generateTitleWithAI` to use `TitleGeneratorConfig` when enabled
- [x] 4.2 Implement fallback to "first 10 chars + ..." when disabled or failed
- [x] 4.3 Add helper function for fallback title format

## 5. Testing

- [x] 5.1 Test title generation with enabled configuration
- [x] 5.2 Test fallback when disabled
- [x] 5.3 Test environment variable override
