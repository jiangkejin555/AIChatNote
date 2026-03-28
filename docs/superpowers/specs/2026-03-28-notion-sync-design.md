# Feature Design: Sync Notes to Notion

## 1. Overview
Allow users to connect their Notion account via OAuth and seamlessly sync their AI chat notes to Notion. The sync can be triggered during the initial "Save as Note" process or manually from the note detail page.

## 2. Target Audience & Value Proposition
- **Users**: Users who use Notion as their primary second brain / knowledge base.
- **Value**: Prevents knowledge silos by automatically or semi-automatically pushing finalized AI conversations (notes) into a structured Notion workspace.

## 3. Core Architecture (Backend-Driven)
We will adopt a backend-driven approach (Option B discussed in brainstorming) where the Go backend handles the OAuth flow, stores the access tokens, parses Markdown into Notion Blocks, and communicates with the Notion API.

### 3.1 App-Level Configuration
To act as a Public Integration, the backend needs the application's OAuth credentials. These will be added to the `.env` and `config.yaml` files:
```env
NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=your_notion_client_secret
NOTION_REDIRECT_URI=http://localhost:3000/api/integrations/notion/callback
```
*Note: These are global app credentials. Individual user access tokens obtained after authorization will be stored in the database.*

### 3.2 Data Model Changes
Add a new table `user_integrations` to keep the main `users` table clean:
```sql
CREATE TABLE user_integrations (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- e.g., 'notion'
    access_token TEXT NOT NULL,
    notion_workspace_id VARCHAR(255),
    notion_root_page_id VARCHAR(255), -- Page selected during OAuth
    notion_app_page_id VARCHAR(255),  -- The "AIChatNote" folder page we auto-create
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, provider)
);
```

Extend the existing `notes` table:
```sql
ALTER TABLE notes 
ADD COLUMN notion_page_id VARCHAR(255),
ADD COLUMN notion_last_sync_at TIMESTAMP WITH TIME ZONE;
```

### 3.3 Backend API Routes
- **OAuth Endpoints:**
  - `GET /api/integrations/notion/auth-url`: Returns the OAuth URL to redirect the user to Notion.
  - `POST /api/integrations/notion/callback`: Handles the OAuth callback, exchanges code for token, stores it, and auto-creates the "AIChatNote" parent page.
  - `GET /api/integrations/notion/status`: Checks if the user has connected Notion.
  - `DELETE /api/integrations/notion/disconnect`: Revokes/Removes the integration.
- **Sync Endpoints:**
  - `POST /api/notes/:id/sync/notion`: Triggers the sync for a specific note.

### 3.4 The "Update" Strategy (Soft Delete & Recreate)
Notion's API does not support bulk replacing page content easily due to its Block architecture. 
When a note is synced that already has a `notion_page_id`:
1. The backend makes an API call to Archive (soft delete) the existing `notion_page_id`.
2. The backend creates a completely new Page under the `notion_app_page_id` with the updated Markdown (parsed into blocks).
3. The new Page ID is saved back to `notes.notion_page_id`, and `notion_last_sync_at` is updated.

## 4. Frontend & UI Design

### 4.1 Sync States
The frontend will derive the sync state based on `notion_page_id`, `notion_last_sync_at`, and the note's `updated_at`:
- **Unsynced**: `notion_page_id` is null.
- **Synced (Up to date)**: `notion_page_id` is not null AND `notion_last_sync_at` >= `updated_at`.
- **Modified (Pending Sync)**: `notion_page_id` is not null AND `notion_last_sync_at` < `updated_at`.

### 4.2 UI Modifications
1. **Settings Page (`/settings`)**:
   - Add an "Integrations" section.
   - Show Notion status: "Connect Notion" button or "Connected" with a disconnect option.
2. **Save Note Dialog (`SaveNoteDialog` component)**:
   - If Notion is connected, show a checkbox: `[x] Sync to Notion`.
   - If checked, the save request to the backend will sequentially trigger the Notion sync.
3. **Note Detail/Editor View**:
   - Add a Notion icon in the top action bar.
   - Icon state reflects the 3 states mentioned above (e.g., Gray/Normal for Unsynced, Green/Check for Synced, Orange/Dot for Modified).
   - Clicking it triggers the manual sync API.

## 5. Implementation Complexity & Risks
- **Markdown to Notion Block Parsing**: The Go backend needs a robust way to convert Markdown strings into Notion's JSON block structure. This might require writing a custom parser or finding a reliable Go package (e.g., utilizing `github.com/yuin/goldmark` AST to generate Notion blocks).
- **OAuth Scopes**: Ensure the Notion Integration is configured with `read/write` access to content.
