## ADDED Requirements

### Requirement: Sliding window message filtering

When the number of messages in a conversation exceeds the window size (20), the system SHALL apply sliding window filtering to limit the messages sent to the LLM.

#### Scenario: Messages within window limit
- **WHEN** a conversation has 15 messages
- **THEN** all 15 messages are sent to the LLM without summarization

#### Scenario: Messages exceed window limit
- **WHEN** a conversation has 25 messages
- **THEN** the system generates a summary of early messages and sends [summary + recent 10 messages] to the LLM

### Requirement: Summary generation

The system SHALL generate conversation summaries using the LLM when triggered by the sliding window mechanism.

#### Scenario: Initial summary generation
- **WHEN** a conversation exceeds 20 messages for the first time
- **THEN** the system generates a summary of messages 1-10
- **AND** the summary is stored in the database with EndMessageID = 10

#### Scenario: Summary with weighted compression
- **WHEN** generating a summary
- **THEN** early messages (first 1/3) are lightly summarized
- **AND** middle messages (middle 1/3) retain key points
- **AND** recent messages (last 1/3) retain full details including code and data

#### Scenario: Summary preserves important content
- **WHEN** generating a summary
- **THEN** code snippets are preserved completely
- **AND** technical details are not over-simplified
- **AND** key decisions and conclusions are retained

### Requirement: Incremental summary update

The system SHALL support incremental summary updates to avoid reprocessing all historical messages.

#### Scenario: Incremental update triggered
- **WHEN** 5 new messages are added after the current summary's EndMessageID
- **THEN** the system generates a new summary by compressing [old summary + new messages]

#### Scenario: Incremental update result
- **WHEN** an incremental update completes
- **THEN** the summary is updated in place
- **AND** EndMessageID is updated to reflect the new coverage

### Requirement: Summary storage

The system SHALL store conversation summaries in the database for reuse.

#### Scenario: Summary persistence
- **WHEN** a summary is generated
- **THEN** it is saved to the conversation_summaries table
- **AND** only one summary exists per conversation (unique constraint)

#### Scenario: Summary retrieval
- **WHEN** building context messages for a conversation with existing summary
- **THEN** the system retrieves the summary from database
- **AND** combines it with recent raw messages

### Requirement: Synchronous summary generation

The system SHALL generate summaries synchronously during the message send flow.

#### Scenario: User waits for summary
- **WHEN** a summary needs to be generated or updated
- **THEN** the user request is blocked until summary generation completes
- **AND** the response includes the LLM's reply based on the new summary

#### Scenario: Summary generation failure
- **WHEN** summary generation fails
- **THEN** the system falls back to using full conversation history
- **AND** the error is logged for debugging

### Requirement: Summary model selection

The system SHALL use the conversation's associated model for summary generation.

#### Scenario: Using conversation model
- **WHEN** generating a summary for a conversation
- **THEN** the system uses the same ProviderModel as the conversation
- **AND** uses the same API credentials (decrypted API key)
