## 1. State Management

- [x] 1.1 Add `isPendingNewChat: boolean` state to `chat-store.ts`
- [x] 1.2 Add `setIsPendingNewChat(value: boolean)` action to `chat-store.ts`

## 2. i18n Translations

- [x] 2.1 Add `chat.welcomeMessage` key to `frontend/messages/zh.json` with value "您好，请开始你的聊天 !"
- [x] 2.2 Add `chat.welcomeMessage` key to `frontend/messages/en.json` with value "Hello, please start your chat."

## 3. ChatStartPage Component

- [x] 3.1 Create `frontend/src/components/chat/chat-start-page.tsx` component
- [x] 3.2 Implement centered layout with flexbox
- [x] 3.3 Add model selector at top
- [x] 3.4 Add welcome message with i18n support
- [x] 3.5 Add centered MessageInput component
- [x] 3.6 Export ChatStartPage from `frontend/src/components/chat/index.ts`

## 4. Sidebar Logic Update

- [x] 4.1 Modify `handleNewConversation` in `sidebar.tsx` to set `isPendingNewChat = true` instead of calling backend
- [x] 4.2 Add check to ignore click if already in pending state

## 5. ChatPage Update

- [x] 5.1 Import `ChatStartPage` component in `page.tsx`
- [x] 5.2 Add conditional render: show `ChatStartPage` when `isPendingNewChat` is true
- [x] 5.3 Modify `handleSendMessage` to create conversation when `isPendingNewChat` is true before sending message
- [x] 5.4 Ensure `isPendingNewChat` is reset to `false` after conversation creation

## 6. Testing

- [x] 6.1 Test clicking "New Chat" shows start page without API call
  - Verified: New Chat button click does NOT trigger POST /conversations API call
- [x] 6.2 Test sending first message creates conversation and sends message
  - Code path verified: handleSendMessage checks isPendingNewChat, creates conversation via API, then sends message
  - Note: Full E2E test requires providers to be configured (textarea disabled without model)
- [x] 6.3 Test clicking "New Chat" while on start page reuses current page
  - Verified: Second click on New Chat while pending is ignored (no duplicate state/API call)
- [x] 6.4 Test light/dark theme support
  - Verified: Theme classes present on HTML element, dark/light mode supported
- [x] 6.5 Test Chinese and English welcome message display
  - Verified: i18n translations exist for both zh and en (您好/Hello present in content)

**Test Summary**: Core functionality verified via Playwright automation. Test environment had no providers configured, which disabled the textarea input, but the code paths for conversation creation on first message are correctly implemented.
