# Notion Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to connect their Notion account via OAuth and sync their AI chat notes into a dedicated Notion page.

**Architecture:** A backend-driven integration where the Go backend handles OAuth flow with Notion, stores tokens, converts Markdown to Notion blocks, and communicates with the Notion API. The Next.js frontend provides the UI for connection and triggers syncs.

**Tech Stack:** Go, Gin, PostgreSQL, Next.js, React, TailwindCSS, Notion API.

---

## File Structure

**Backend (Go):**
- `backend/migrations/xxx_add_notion_integrations.up.sql` (New): Database migration for `user_integrations` and new columns in `notes`.
- `backend/config.yaml` / `.env.example` (Modify): Add Notion App credentials.
- `backend/internal/models/integration.go` (New): Model for `user_integrations`.
- `backend/internal/models/note.go` (Modify): Add Notion fields.
- `backend/internal/repository/integration_repository.go` (New): DB operations for integrations.
- `backend/internal/repository/note_repository.go` (Modify): Update query methods.
- `backend/internal/services/notion_service.go` (New): Core logic for Notion API (OAuth, Pages, Blocks).
- `backend/internal/services/markdown_parser.go` (New): Utility to parse MD to Notion Blocks.
- `backend/internal/handlers/integration_handler.go` (New): HTTP handlers for OAuth.
- `backend/internal/handlers/note_handler.go` (Modify): Add sync endpoint and update save note logic.
- `backend/cmd/api/main.go` / `router.go` (Modify): Register new routes.

**Frontend (Next.js):**
- `frontend/src/types/integration.ts` (New): TypeScript interfaces.
- `frontend/src/types/note.ts` (Modify): Add Notion fields.
- `frontend/src/services/integration.ts` (New): API client for integrations.
- `frontend/src/services/note.ts` (Modify): Add sync API call.
- `frontend/src/app/(main)/settings/integrations/page.tsx` (New): Settings page for Notion connection.
- `frontend/src/app/auth/notion/callback/page.tsx` (New): OAuth callback handler page.
- `frontend/src/components/notes/SaveNoteDialog.tsx` (Modify): Add sync checkbox.
- `frontend/src/components/notes/NoteDetailHeader.tsx` (Modify): Add Notion sync status icon and button.

---

### Task 1: Database Schema & Models

**Files:**
- Create: `backend/migrations/20260328_add_notion_sync.up.sql`
- Create: `backend/migrations/20260328_add_notion_sync.down.sql`
- Modify: `backend/internal/models/note.go`
- Create: `backend/internal/models/integration.go`

- [ ] **Step 1: Write migration files**
Create the UP migration to add `user_integrations` table and alter `notes` table.
Create the DOWN migration to drop them.

- [ ] **Step 2: Update Note Model**
Add `NotionPageID` (sql.NullString) and `NotionLastSyncAt` (sql.NullTime) to the `Note` struct with JSON tags `notion_page_id` and `notion_last_sync_at`.

- [ ] **Step 3: Create Integration Model**
Create `Integration` struct in `integration.go` with ID, UserID, Provider, AccessToken, NotionWorkspaceID, NotionRootPageID, NotionAppPageID, CreatedAt, UpdatedAt.

- [ ] **Step 4: Run tests / migrate**
Run `make migrate-up` or equivalent to ensure database schema updates cleanly.

- [ ] **Step 5: Commit**
`git add backend/migrations backend/internal/models`
`git commit -m "feat(db): add schema and models for notion integration"`

---

### Task 2: Config & Integration Repository

**Files:**
- Modify: `backend/config.yaml`, `backend/.env.example`, `backend/internal/config/config.go`
- Create: `backend/internal/repository/integration_repository.go`

- [ ] **Step 1: Update Config**
Add `Notion` struct to `config.go` (ClientID, ClientSecret, RedirectURI). Update `config.yaml` and `.env.example` with placeholders.

- [ ] **Step 2: Create Integration Repository**
Implement `GetByUserIDAndProvider`, `CreateOrUpdate`, `Delete` methods using standard SQL/GORM.

- [ ] **Step 3: Update Note Repository**
Ensure `UpdateNote` in `note_repository.go` can save the new `notion_page_id` and `notion_last_sync_at` fields.

- [ ] **Step 4: Commit**
`git add backend/config.yaml backend/.env.example backend/internal/config backend/internal/repository`
`git commit -m "feat(repo): add config and repository layer for integrations"`

---

### Task 3: Notion Service - OAuth & App Page

**Files:**
- Create: `backend/internal/services/notion_service.go`
- Create: `backend/internal/services/notion_service_test.go`

- [ ] **Step 1: Define Service Interface**
Define `NotionService` with `GetAuthURL`, `HandleCallback(code, userID)`.

- [ ] **Step 2: Implement GetAuthURL**
Construct the standard Notion OAuth 2.0 authorization URL using client ID and redirect URI.

- [ ] **Step 3: Implement HandleCallback logic**
Exchange `code` for `access_token` via `POST https://api.notion.com/v1/oauth/token`.

- [ ] **Step 4: Auto-create App Page in HandleCallback**
Using the retrieved token, call Notion API `POST /v1/pages` to create the "AIChatNote" parent page under the workspace.

- [ ] **Step 5: Save Integration Data**
Save the token and the newly created `notion_app_page_id` to `user_integrations` via repository.

- [ ] **Step 6: Write unit tests**
Mock the external HTTP calls and test `HandleCallback` success and failure flows.

- [ ] **Step 7: Commit**
`git add backend/internal/services/notion_service.go backend/internal/services/notion_service_test.go`
`git commit -m "feat(service): implement notion oauth flow and app page creation"`

---

### Task 4: API Handlers for Integrations

**Files:**
- Create: `backend/internal/handlers/integration_handler.go`
- Modify: `backend/cmd/api/router.go`

- [ ] **Step 1: Create Handlers**
Implement `GetNotionAuthURL`, `NotionCallback`, `GetNotionStatus`, `DisconnectNotion`.

- [ ] **Step 2: Register Routes**
Add to router:
`GET /api/integrations/notion/auth-url`
`POST /api/integrations/notion/callback`
`GET /api/integrations/notion/status` (requires auth)
`DELETE /api/integrations/notion/disconnect` (requires auth)

- [ ] **Step 3: Commit**
`git add backend/internal/handlers backend/cmd/api`
`git commit -m "feat(api): add integration endpoints"`

---

### Task 5: Frontend - Settings Page for Notion

**Files:**
- Create: `frontend/src/services/integration.ts`
- Create: `frontend/src/app/(main)/settings/integrations/page.tsx`
- Create: `frontend/src/app/auth/notion/callback/page.tsx`
- Modify: `frontend/src/components/layout/SettingsSidebar.tsx` (or equivalent navigation)

- [ ] **Step 1: API Client**
Add fetch functions in `integration.ts` to call status, auth-url, callback, and disconnect endpoints.

- [ ] **Step 2: Build Integrations UI**
Create the Integrations settings page. Fetch status on mount.
If disconnected: Show "Connect Notion" button (redirects to auth URL).
If connected: Show "Connected" and a "Disconnect" button.

- [ ] **Step 3: Build OAuth Callback Page**
Create `frontend/src/app/auth/notion/callback/page.tsx` to grab the `code` from URL parameters.
Call the backend callback endpoint, then redirect back to settings.

- [ ] **Step 4: Commit**
`git add frontend/src`
`git commit -m "feat(ui): add notion integration settings and callback handling"`

---

### Task 6: Notion Service - Sync Logic & Markdown Parser

**Files:**
- Create: `backend/internal/services/markdown_parser.go`
- Create: `backend/internal/services/markdown_parser_test.go`
- Modify: `backend/internal/services/notion_service.go`

- [ ] **Step 1: Markdown Parser - Setup & Basic Text**
Implement a utility using a Go AST parser (like `yuin/goldmark`) to iterate over Markdown nodes. Parse basic paragraphs and convert them to Notion paragraph blocks JSON.

- [ ] **Step 2: Markdown Parser - Advanced Blocks**
Extend parser to support Headings (h1/h2/h3), lists, and code blocks.

- [ ] **Step 3: Write tests for Markdown Parser**
Write unit tests with various markdown snippets to ensure the resulting Notion block JSON is correct.

- [ ] **Step 4: Sync Note Method**
In `NotionService`, implement `SyncNote(noteID, userID)`:
1. Fetch note and integration token.
2. If note has `notion_page_id`, call Notion API `PATCH /v1/pages/{id}` to set `archived: true`.
3. Parse Note Content to Blocks using the new utility.
4. Call Notion API `POST /v1/pages` with parent=`notion_app_page_id`, title=Note.Title, and children=Blocks.
5. Update Note DB with new `notion_page_id` and `notion_last_sync_at = now`.

- [ ] **Step 5: Write tests for SyncNote**
Write unit tests for `SyncNote` mocking the database and external API.

- [ ] **Step 6: Commit**
`git add backend/internal/services`
`git commit -m "feat(service): implement note syncing and basic markdown to block conversion"`

---

### Task 7: API Handlers for Syncing

**Files:**
- Modify: `backend/internal/handlers/note_handler.go`
- Modify: `backend/cmd/api/router.go`

- [ ] **Step 1: Sync Endpoint**
Add `SyncNoteToNotion` handler. Route: `POST /api/notes/:id/sync/notion`. Calls `NotionService.SyncNote`.

- [ ] **Step 2: Auto-sync on Save**
Modify existing `SaveNote` or `CreateNote` handler: if request payload contains `sync_to_notion: true`, trigger sync asynchronously or synchronously after save.

- [ ] **Step 3: Commit**
`git add backend/internal/handlers backend/cmd/api`
`git commit -m "feat(api): add sync note endpoint and auto-sync flag"`

---

### Task 8: Frontend - Sync UI

**Files:**
- Modify: `frontend/src/types/note.ts`
- Modify: `frontend/src/services/note.ts`
- Modify: `frontend/src/components/notes/SaveNoteDialog.tsx`
- Modify: `frontend/src/components/notes/NoteDetailHeader.tsx`

- [ ] **Step 1: Update Types & Services**
Add `notion_page_id` and `notion_last_sync_at` to Note type. Add `syncNoteToNotion(id)` service function. Update save payload type to include `sync_to_notion` boolean.

- [ ] **Step 2: Save Note Dialog**
Fetch Notion status. If connected, show "[x] Sync to Notion" checkbox. Pass value in save API.

- [ ] **Step 3: Note Detail Header**
Calculate sync status:
`Unsynced` (null ID), `Synced` (ID present, sync_at >= updated_at), `Modified` (ID present, sync_at < updated_at).
Display corresponding icon/tooltip. Add onClick to trigger `syncNoteToNotion` and show a toast/loading state.

- [ ] **Step 4: Commit**
`git add frontend/src`
`git commit -m "feat(ui): add notion sync triggers in save dialog and note detail"`