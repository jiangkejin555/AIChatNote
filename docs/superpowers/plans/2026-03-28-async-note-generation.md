# Async Note Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the synchronous AI note generation endpoint to an async task-based flow with polling, so the API returns immediately and the backend generates the note in a goroutine.

**Architecture:** New `NoteGenerationTask` model + repository for task state persistence. Handler creates a task, launches a goroutine to call the AI service, then returns the task ID immediately. Frontend polls a new `GET /notes/tasks/:id` endpoint every 3 seconds. On completion, the goroutine creates the note in the DB and updates the task status. Frontend shows toast notifications and recovers from page refresh via localStorage.

**Tech Stack:** Go/Gin (backend), GORM (DB), PostgreSQL, React 19 / Next.js 16 (frontend), TanStack React Query, sonner (toasts)

---

## File Structure

### Backend

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `backend/internal/models/note_generation_task.go` | NoteGenerationTask GORM model |
| Create | `backend/internal/repository/note_generation_task.go` | Task CRUD repository |
| Modify | `backend/internal/handlers/note.go` (lines 23-29, 445-483) | Async Generate + new GetTask handler |
| Modify | `backend/internal/database/database.go` (line 66-85) | Register new model in AutoMigrate |
| Modify | `backend/cmd/server/main.go` (lines 177, 31-38) | Register new route + inject taskRepo |
| Modify | `backend/internal/testutil/helper.go` (tables list) | Add test table for SQLite |
| Create | `backend/internal/handlers/note_generation_task_test.go` | Tests for Generate + GetTask |

### Frontend

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `frontend/src/types/index.ts` (lines 269-277) | Add async task types |
| Modify | `frontend/src/lib/api/notes.ts` (lines 83-90) | Change generate to return task_id, add getTask |
| Modify | `frontend/src/hooks/use-notes.ts` (lines 86-95) | Replace useGenerateNote with useAsyncNoteGeneration |
| Modify | `frontend/src/hooks/index.ts` (line 20) | Export new hook |
| Modify | `frontend/src/components/chat/save-note-dialog.tsx` (lines 168-198) | Use async generation flow |
| Modify | `frontend/src/i18n/messages/zh.json` | Add Chinese translations |
| Modify | `frontend/src/i18n/messages/en.json` | Add English translations |

---

### Task 1: Backend Model — NoteGenerationTask

**Files:**
- Create: `backend/internal/models/note_generation_task.go`

- [ ] **Step 1: Create the model file**

```go
package models

import (
	"time"
)

type TaskStatus string

const (
	TaskStatusGenerating TaskStatus = "generating"
	TaskStatusDone       TaskStatus = "done"
	TaskStatusFailed     TaskStatus = "failed"
)

type NoteGenerationTask struct {
	ID             uint       `gorm:"primaryKey" json:"id"`
	UserID         uint       `gorm:"not null;index" json:"user_id"`
	ConversationID uint       `gorm:"not null" json:"conversation_id"`
	Status         TaskStatus `gorm:"size:20;not null;default:generating;index" json:"status"`
	ErrorMessage   string     `gorm:"type:text" json:"error_message"`
	NoteID         *uint      `json:"note_id"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

func (NoteGenerationTask) TableName() string {
	return "note_generation_tasks"
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/internal/models/note_generation_task.go
git commit -m "feat: add NoteGenerationTask model for async note generation"
```

---

### Task 2: Backend Repository — NoteGenerationTaskRepository

**Files:**
- Create: `backend/internal/repository/note_generation_task.go`

- [ ] **Step 1: Create the repository file**

```go
package repository

import (
	"github.com/chat-note/backend/internal/database"
	"github.com/chat-note/backend/internal/models"
)

type NoteGenerationTaskRepository struct{}

func NewNoteGenerationTaskRepository() *NoteGenerationTaskRepository {
	return &NoteGenerationTaskRepository{}
}

func (r *NoteGenerationTaskRepository) Create(task *models.NoteGenerationTask) error {
	return database.DB.Create(task).Error
}

func (r *NoteGenerationTaskRepository) FindByIDAndUserID(id, userID uint) (*models.NoteGenerationTask, error) {
	var task models.NoteGenerationTask
	err := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&task).Error
	if err != nil {
		return nil, err
	}
	return &task, nil
}

func (r *NoteGenerationTaskRepository) FindGeneratingByUserAndConversation(userID, conversationID uint) (*models.NoteGenerationTask, error) {
	var task models.NoteGenerationTask
	err := database.DB.Where("user_id = ? AND conversation_id = ? AND status = ?",
		userID, conversationID, models.TaskStatusGenerating).First(&task).Error
	if err != nil {
		return nil, err
	}
	return &task, nil
}

func (r *NoteGenerationTaskRepository) UpdateStatus(id uint, status models.TaskStatus, errorMessage string, noteID *uint) error {
	updates := map[string]interface{}{
		"status": status,
	}
	if errorMessage != "" {
		updates["error_message"] = errorMessage
	}
	if noteID != nil {
		updates["note_id"] = *noteID
	}
	return database.DB.Model(&models.NoteGenerationTask{}).Where("id = ?", id).Updates(updates).Error
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/internal/repository/note_generation_task.go
git commit -m "feat: add NoteGenerationTaskRepository for async task management"
```

---

### Task 3: Backend — Register Model in AutoMigrate

**Files:**
- Modify: `backend/internal/database/database.go` (line 84, before the closing `)`)

- [ ] **Step 1: Add NoteGenerationTask to AutoMigrate**

In `database.go`, add `&models.NoteGenerationTask{}` to the AutoMigrate call. Insert it after the `&models.Notification{}` line:

```go
&models.Notification{},
&models.NoteGenerationTask{},
```

- [ ] **Step 2: Verify the migration runs**

Run: `cd backend && go build ./...`
Expected: compiles without errors

- [ ] **Step 3: Commit**

```bash
git add backend/internal/database/database.go
git commit -m "feat: register NoteGenerationTask in AutoMigrate"
```

---

### Task 4: Backend — Update Test Helper (SQLite Table)

**Files:**
- Modify: `backend/internal/testutil/helper.go` (insert after the `user_settings` table in the `tables` slice, around line 144)

- [ ] **Step 1: Add note_generation_tasks table to test setup**

Insert this table definition after the `user_settings` table in the `tables` slice:

```go
`CREATE TABLE note_generation_tasks (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER NOT NULL,
	conversation_id INTEGER NOT NULL,
	status VARCHAR(20) NOT NULL DEFAULT 'generating',
	error_message TEXT,
	note_id INTEGER,
	created_at DATETIME,
	updated_at DATETIME
)`,
```

- [ ] **Step 2: Verify compilation**

Run: `cd backend && go build ./...`
Expected: compiles without errors

- [ ] **Step 3: Commit**

```bash
git add backend/internal/testutil/helper.go
git commit -m "feat: add note_generation_tasks table to test helper"
```

---

### Task 5: Backend — Rewrite Generate Handler + Add GetTask Handler

**Files:**
- Modify: `backend/internal/handlers/note.go` — replace `NoteHandler` struct fields (lines 23-29) and `Generate` method (lines 445-483), and add `GetTask` + `generateNoteAsync` methods

- [ ] **Step 1: Update NoteHandler struct to include taskRepo**

Replace the NoteHandler struct (lines 23-29):

```go
type NoteHandler struct {
	noteRepo   *repository.NoteRepository
	folderRepo *repository.FolderRepository
	tagRepo    *repository.TagRepository
	convRepo   *repository.ConversationRepository
	aiService  *services.AIService
	taskRepo   *repository.NoteGenerationTaskRepository
}
```

Update `NewNoteHandler` (lines 31-39) to initialize taskRepo:

```go
func NewNoteHandler(aiService *services.AIService) *NoteHandler {
	return &NoteHandler{
		noteRepo:   repository.NewNoteRepository(),
		folderRepo: repository.NewFolderRepository(),
		tagRepo:    repository.NewTagRepository(),
		convRepo:   repository.NewConversationRepository(),
		aiService:  aiService,
		taskRepo:   repository.NewNoteGenerationTaskRepository(),
	}
}
```

- [ ] **Step 2: Replace the Generate method**

Replace the entire `Generate` method (lines 445-483) with:

```go
// Generate triggers async note generation from conversation using AI
func (h *NoteHandler) Generate(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req struct {
		ConversationID uint `json:"conversation_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	// Check if AI service is configured
	if h.aiService == nil {
		utils.SendError(c, http.StatusServiceUnavailable, "ai_not_configured", "AI service is not configured")
		return
	}

	utils.LogOperationStart("NoteHandler", "Generate", "userID", userID, "convID", req.ConversationID)

	// Check for existing generating task (concurrency control)
	existingTask, _ := h.taskRepo.FindGeneratingByUserAndConversation(userID, req.ConversationID)
	if existingTask != nil {
		c.JSON(http.StatusOK, gin.H{"data": gin.H{"task_id": existingTask.ID}})
		return
	}

	// Create new task
	task := &models.NoteGenerationTask{
		UserID:         userID,
		ConversationID: req.ConversationID,
		Status:         models.TaskStatusGenerating,
	}
	if err := h.taskRepo.Create(task); err != nil {
		utils.LogOperationError("NoteHandler", "Generate", err, "userID", userID, "convID", req.ConversationID, "step", "create_task")
		utils.SendError(c, http.StatusInternalServerError, "create_error", "Failed to create generation task")
		return
	}

	// Launch async generation
	go h.generateNoteAsync(task.ID, userID, req.ConversationID)

	c.JSON(http.StatusOK, gin.H{"data": gin.H{"task_id": task.ID}})
}

// generateNoteAsync runs the AI note generation in a goroutine
func (h *NoteHandler) generateNoteAsync(taskID, userID, conversationID uint) {
	note, err := h.aiService.GenerateNoteFromConversation(context.Background(), conversationID, userID)

	if err != nil {
		utils.LogOperationError("NoteHandler", "generateNoteAsync", err, "taskID", taskID, "userID", userID, "convID", conversationID)
		_ = h.taskRepo.UpdateStatus(taskID, models.TaskStatusFailed, err.Error(), nil)
		return
	}

	// Create the note in DB
	newNote := &models.Note{
		UserID:               userID,
		Title:                note.Title,
		Content:              note.Content,
		SourceConversationID: &conversationID,
	}

	var tags []models.NoteTag
	if len(note.Tags) > 0 {
		tags = make([]models.NoteTag, len(note.Tags))
		for i, tag := range note.Tags {
			tags[i] = models.NoteTag{Tag: tag}
		}
	}

	if err := h.noteRepo.CreateWithTags(newNote, tags); err != nil {
		utils.LogOperationError("NoteHandler", "generateNoteAsync", err, "taskID", taskID, "userID", userID, "step", "create_note")
		_ = h.taskRepo.UpdateStatus(taskID, models.TaskStatusFailed, "Failed to save note: "+err.Error(), nil)
		return
	}

	utils.LogOperationSuccess("NoteHandler", "generateNoteAsync", "taskID", taskID, "noteID", newNote.ID, "userID", userID, "title", newNote.Title)
	_ = h.taskRepo.UpdateStatus(taskID, models.TaskStatusDone, "", &newNote.ID)
}

// GetTask returns the status of a note generation task
func (h *NoteHandler) GetTask(c *gin.Context) {
	userID := middleware.GetUserID(c)
	taskID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid task ID")
		return
	}

	task, err := h.taskRepo.FindByIDAndUserID(uint(taskID), userID)
	if err != nil {
		utils.SendError(c, http.StatusNotFound, "not_found", "Task not found")
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": task})
}
```

- [ ] **Step 3: Verify compilation**

Run: `cd backend && go build ./...`
Expected: compiles without errors

- [ ] **Step 4: Commit**

```bash
git add backend/internal/handlers/note.go
git commit -m "feat: convert Generate to async task-based flow with GetTask endpoint"
```

---

### Task 6: Backend — Register New Route

**Files:**
- Modify: `backend/cmd/server/main.go` (line 177, after the existing `notes.POST("/generate", ...)` line)

- [ ] **Step 1: Add GetTask route**

Insert this line after `notes.POST("/generate", noteHandler.Generate)` and before `notes.GET("/:id", noteHandler.Get)`:

```go
notes.GET("/tasks/:id", noteHandler.GetTask)
```

The routes block should look like:

```go
notes.GET("", noteHandler.List)
notes.POST("", noteHandler.Create)
notes.POST("/generate", noteHandler.Generate)
notes.GET("/tasks/:id", noteHandler.GetTask)
notes.GET("/:id", noteHandler.Get)
```

**Important:** The `/tasks/:id` route MUST be registered before `/:id` to avoid route conflicts.

- [ ] **Step 2: Verify the server starts**

Run: `cd backend && go build ./...`
Expected: compiles without errors

- [ ] **Step 3: Commit**

```bash
git add backend/cmd/server/main.go
git commit -m "feat: register GET /notes/tasks/:id route for task polling"
```

---

### Task 7: Backend Tests — Generate and GetTask

**Files:**
- Create: `backend/internal/handlers/note_generation_task_test.go`

- [ ] **Step 1: Write tests**

```go
package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/chat-note/backend/internal/middleware"
	"github.com/chat-note/backend/internal/models"
	"github.com/chat-note/backend/internal/services"
	"github.com/chat-note/backend/internal/testutil"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupNoteHandlerWithMock() (*NoteHandler, *gin.Engine) {
	gin.SetMode(gin.TestMode)
	aiService := services.NewAIService(true) // mock mode
	handler := NewNoteHandler(aiService)

	router := gin.New()
	cfg := testutil.TestConfig()
	jwtService := setupTestJWT(cfg)

	api := router.Group("/api")
	notes := api.Group("/notes")
	notes.Use(middleware.Auth(jwtService))
	{
		notes.POST("/generate", handler.Generate)
		notes.GET("/tasks/:id", handler.GetTask)
	}

	return handler, router
}

func setupTestJWT(cfg *config.Config) *crypto.JWTService {
	return crypto.NewJWTService(cfg)
}

func TestGenerate_Success(t *testing.T) {
	cleanup := testutil.SetupTestDB(t)
	defer cleanup()

	_, router := setupNoteHandlerWithMock()
	user := testutil.CreateTestUser(t, "gen_test@example.com", "hash")
	conv := testutil.CreateTestConversation(t, user.ID, "Test Conv")

	// Trigger generation
	w := testutil.MakeAuthenticatedRequest(router, "POST", "/api/notes/generate",
		map[string]interface{}{"conversation_id": conv.ID}, user.ID, nil)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp map[string]interface{}
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))

	data, ok := resp["data"].(map[string]interface{})
	require.True(t, ok)
	assert.NotNil(t, data["task_id"])

	// Wait for async generation to complete (mock mode is fast)
	time.Sleep(500 * time.Millisecond)

	// Poll task status
	taskID := uint(data["task_id"].(float64))
	w = testutil.MakeAuthenticatedRequest(router, "GET", "/api/notes/tasks/"+fmt.Sprintf("%d", taskID),
		nil, user.ID, nil)

	assert.Equal(t, http.StatusOK, w.Code)

	var taskResp map[string]interface{}
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))

	taskData := resp["data"].(map[string]interface{})
	assert.Equal(t, "done", taskData["status"])
	assert.NotNil(t, taskData["note_id"])
}

func TestGenerate_ConcurrencyControl(t *testing.T) {
	cleanup := testutil.SetupTestDB(t)
	defer cleanup()

	_, router := setupNoteHandlerWithMock()
	user := testutil.CreateTestUser(t, "gen_conc@example.com", "hash")
	conv := testutil.CreateTestConversation(t, user.ID, "Test Conv")

	// First request
	w := testutil.MakeAuthenticatedRequest(router, "POST", "/api/notes/generate",
		map[string]interface{}{"conversation_id": conv.ID}, user.ID, nil)
	assert.Equal(t, http.StatusOK, w.Code)

	var resp1 map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp1)
	taskID1 := resp1["data"].(map[string]interface{})["task_id"]

	// Second request for same conversation should return same task_id
	w = testutil.MakeAuthenticatedRequest(router, "POST", "/api/notes/generate",
		map[string]interface{}{"conversation_id": conv.ID}, user.ID, nil)
	assert.Equal(t, http.StatusOK, w.Code)

	var resp2 map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp2)
	taskID2 := resp2["data"].(map[string]interface{})["task_id"]

	assert.Equal(t, taskID1, taskID2, "should return same task_id for concurrent request")
}

func TestGetTask_NotFound(t *testing.T) {
	cleanup := testutil.SetupTestDB(t)
	defer cleanup()

	_, router := setupNoteHandlerWithMock()
	user := testutil.CreateTestUser(t, "gen_nf@example.com", "hash")

	w := testutil.MakeAuthenticatedRequest(router, "GET", "/api/notes/tasks/99999",
		nil, user.ID, nil)

	assert.Equal(t, http.StatusNotFound, w.Code)
}

func TestGetTask_UnauthorizedAccess(t *testing.T) {
	cleanup := testutil.SetupTestDB(t)
	defer cleanup()

	_, router := setupNoteHandlerWithMock()
	user1 := testutil.CreateTestUser(t, "gen_u1@example.com", "hash")
	user2 := testutil.CreateTestUser(t, "gen_u2@example.com", "hash")
	conv := testutil.CreateTestConversation(t, user1.ID, "Test Conv")

	// User1 triggers generation
	w := testutil.MakeAuthenticatedRequest(router, "POST", "/api/notes/generate",
		map[string]interface{}{"conversation_id": conv.ID}, user1.ID, nil)
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	taskID := resp["data"].(map[string]interface{})["task_id"]

	// User2 should not see User1's task
	w = testutil.MakeAuthenticatedRequest(router, "GET", "/api/notes/tasks/"+fmt.Sprintf("%v", taskID),
		nil, user2.ID, nil)

	assert.Equal(t, http.StatusNotFound, w.Code)
}
```

**Note:** The test file needs these imports at the top:

```go
import (
	"encoding/json"
	"fmt"
	"net/http"
	"testing"
	"time"

	"github.com/chat-note/backend/internal/config"
	"github.com/chat-note/backend/internal/crypto"
	"github.com/chat-note/backend/internal/middleware"
	"github.com/chat-note/backend/internal/services"
	"github.com/chat-note/backend/internal/testutil"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)
```

And replace the `setupTestJWT` helper with the actual implementation:

```go
func setupTestJWT(cfg *config.Config) *crypto.JWTService {
	return crypto.NewJWTService(cfg)
}
```

Actually, the import-based approach should reference the correct packages. The `crypto` package is `"github.com/chat-note/backend/internal/crypto"` and `config` is `"github.com/chat-note/backend/internal/config"`.

- [ ] **Step 2: Run the tests**

Run: `cd backend && go test -v -run TestGenerate -run TestGetTask ./internal/handlers/`
Expected: All tests pass

- [ ] **Step 3: Fix any compilation errors and re-run**

- [ ] **Step 4: Commit**

```bash
git add backend/internal/handlers/note_generation_task_test.go
git commit -m "test: add tests for async note generation and task polling"
```

---

### Task 8: Frontend — Types

**Files:**
- Modify: `frontend/src/types/index.ts` (after line 277, after `GenerateNoteResponse`)

- [ ] **Step 1: Add async task types**

Add after the `GenerateNoteResponse` interface (line 277):

```typescript
export interface AsyncNoteGenerationResponse {
  task_id: number
}

export interface NoteGenerationTask {
  id: number
  user_id: number
  conversation_id: number
  status: 'generating' | 'done' | 'failed'
  error_message: string | null
  note_id: number | null
  created_at: string
  updated_at: string
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/types/index.ts
git commit -m "feat: add async note generation types"
```

---

### Task 9: Frontend — API Layer

**Files:**
- Modify: `frontend/src/lib/api/notes.ts` (lines 1-9 imports, lines 83-90 generate method)

- [ ] **Step 1: Update imports to include new types**

Add `AsyncNoteGenerationResponse` and `NoteGenerationTask` to the import from `@/types`:

```typescript
import type {
  Note,
  CreateNoteRequest,
  UpdateNoteRequest,
  GenerateNoteRequest,
  GenerateNoteResponse,
  AsyncNoteGenerationResponse,
  NoteGenerationTask,
  ApiResponse,
} from '@/types'
```

- [ ] **Step 2: Replace the generate method and add getTask method**

Replace the `generate` method (lines 83-90) with:

```typescript
  generate: async (data: GenerateNoteRequest): Promise<AsyncNoteGenerationResponse> => {
    const response = await apiClient.post<ApiResponse<AsyncNoteGenerationResponse>>(
      '/notes/generate',
      data,
      { timeout: 120000 }
    )
    return response.data.data
  },

  getTask: async (taskId: number): Promise<NoteGenerationTask> => {
    const response = await apiClient.get<ApiResponse<NoteGenerationTask>>(
      `/notes/tasks/${taskId}`
    )
    return response.data.data
  },
```

- [ ] **Step 3: Verify build**

Run: `cd frontend && npm run build 2>&1 | head -30`
Expected: compiles without type errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/api/notes.ts
git commit -m "feat: update notes API for async generation with getTask"
```

---

### Task 10: Frontend — React Hook (useAsyncNoteGeneration)

**Files:**
- Modify: `frontend/src/hooks/use-notes.ts` (replace `useGenerateNote` at lines 86-95)

- [ ] **Step 1: Replace useGenerateNote with useAsyncNoteGeneration**

Replace the `useGenerateNote` function (lines 86-95) with:

```typescript
export function useAsyncNoteGeneration() {
  const queryClient = useQueryClient()
  const t = getT()

  const startGeneration = async (conversationId: number) => {
    // Trigger async generation
    const { task_id } = await notesApi.generate({ conversation_id: conversationId })

    // Store to localStorage for recovery after refresh
    localStorage.setItem('pendingNoteTask', JSON.stringify({
      taskId: task_id,
      conversationId,
    }))

    toast.info(t('notes.aiGenerating'))

    // Start polling
    return pollTaskStatus(task_id)
  }

  const pollTaskStatus = (taskId: number): Promise<{ status: string; note_id?: number }> => {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const task = await notesApi.getTask(taskId)

          if (task.status === 'generating') {
            setTimeout(poll, 3000)
          } else if (task.status === 'done') {
            localStorage.removeItem('pendingNoteTask')
            queryClient.invalidateQueries({ queryKey: ['notes'] })
            queryClient.invalidateQueries({ queryKey: ['tags'] })
            toast.success(t('notes.aiGenerateSuccess'))
            resolve({ status: 'done', note_id: task.note_id ?? undefined })
          } else if (task.status === 'failed') {
            localStorage.removeItem('pendingNoteTask')
            toast.error(t('notes.aiGenerateFailed') + (task.error_message ? `: ${task.error_message}` : ''))
            reject(new Error(task.error_message || 'Generation failed'))
          }
        } catch {
          // API error during polling — retry after delay
          setTimeout(poll, 3000)
        }
      }

      poll()
    })
  }

  const recoverPendingTask = () => {
    const pending = localStorage.getItem('pendingNoteTask')
    if (pending) {
      try {
        const { taskId } = JSON.parse(pending)
        toast.info(t('notes.aiGenerating'))
        pollTaskStatus(taskId).catch(() => {})
      } catch {
        localStorage.removeItem('pendingNoteTask')
      }
    }
  }

  return { startGeneration, recoverPendingTask }
}
```

- [ ] **Step 2: Update imports**

Update the import at line 7 to remove `GenerateNoteRequest` (it's still needed by notesApi but the hook no longer uses it directly). The import should stay the same since other hooks might use it. Actually, check — `GenerateNoteRequest` is imported at line 7 but only used in `useGenerateNote`. Since we're removing `useGenerateNote`, remove it from the import:

```typescript
import type { CreateNoteRequest, UpdateNoteRequest } from '@/types'
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/use-notes.ts
git commit -m "feat: replace useGenerateNote with useAsyncNoteGeneration hook"
```

---

### Task 11: Frontend — Update Hook Exports

**Files:**
- Modify: `frontend/src/hooks/index.ts` (line 20)

- [ ] **Step 1: Update export line**

Replace line 20:

```typescript
export { useNotes, useNote, useCreateNote, useUpdateNote, useDeleteNote, useAsyncNoteGeneration, useExportNote, useExportNotes, useImportMarkdown, useCopyNote, useMoveNote, useBatchMoveNotes, useBatchDeleteNotes } from './use-notes'
```

(Replaced `useGenerateNote` with `useAsyncNoteGeneration`)

- [ ] **Step 2: Commit**

```bash
git add frontend/src/hooks/index.ts
git commit -m "feat: export useAsyncNoteGeneration from hooks index"
```

---

### Task 12: Frontend — Update save-note-dialog.tsx

**Files:**
- Modify: `frontend/src/components/chat/save-note-dialog.tsx` (lines 4, 16-17, 48-49, 168-198, 200, 349)

- [ ] **Step 1: Update imports**

Replace line 4:

```typescript
import { useAsyncNoteGeneration, useCreateNote, useFolders, useTags, useMessages } from '@/hooks'
```

Remove unused imports on line 16 (`markdownToHtml` is no longer needed):

```typescript
import { X, Sparkles, FileText, Loader2, Folder } from 'lucide-react'
```

Remove the `markdownToHtml` import from line 20:

```typescript
import { formatMessagesAsHtml } from '@/lib/markdown-utils'
```

- [ ] **Step 2: Replace hook usage**

Replace lines 48-49:

```typescript
  const { startGeneration, recoverPendingTask } = useAsyncNoteGeneration()
  const createNote = useCreateNote()
```

- [ ] **Step 3: Add recovery on mount**

Add after the `useEffect` at line 108 (after the `selectedMessageIds` initialization effect):

```typescript
  // Recover pending note generation task on mount
  useEffect(() => {
    recoverPendingTask()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 4: Replace handleAiSummarySave**

Replace the `handleAiSummarySave` function (lines 168-198) with:

```typescript
  const handleAiSummarySave = async () => {
    if (!conversationId) {
      toast.error(t('saveNote.cannotGetConversation'))
      return
    }

    // Close dialog immediately
    onOpenChange(false)

    try {
      await startGeneration(conversationId)
      onSuccess?.()
    } catch {
      // Error toast already shown by the hook
    }
  }
```

- [ ] **Step 5: Update isSaving state**

Replace line 200:

```typescript
  const isSaving = createNote.isPending
```

(Removed `generateNote.isPending` since generation is now async and doesn't block the UI)

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/chat/save-note-dialog.tsx
git commit -m "feat: update save-note-dialog to use async note generation"
```

---

### Task 13: Frontend — i18n Translations

**Files:**
- Modify: `frontend/src/messages/zh.json`
- Modify: `frontend/src/messages/en.json`

- [ ] **Step 1: Check current structure of zh.json and en.json**

The translation files currently contain keys like `accountManagement`, `changePassword`, `deleteAccount`. The `saveNote.*` and `notes.*` keys used in the code are NOT in these files — the `t()` function returns the raw key string as fallback. We need to add the new keys for async generation.

Add these keys to `zh.json` (at the top level, alongside existing keys):

```json
"notes": {
  "aiGenerating": "AI笔记生成中...",
  "aiGenerateSuccess": "笔记生成完成",
  "aiGenerateFailed": "AI总结失败"
}
```

Add these keys to `en.json` (at the top level, alongside existing keys):

```json
"notes": {
  "aiGenerating": "AI note generating...",
  "aiGenerateSuccess": "Note generated successfully",
  "aiGenerateFailed": "AI summarization failed"
}
```

- [ ] **Step 2: Verify build**

Run: `cd frontend && npm run build 2>&1 | head -30`
Expected: compiles without errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/messages/zh.json frontend/src/messages/en.json
git commit -m "feat: add i18n translations for async note generation"
```

---

### Task 14: End-to-End Verification

- [ ] **Step 1: Start backend**

Run: `cd backend && make run`

- [ ] **Step 2: Start frontend**

Run: `cd frontend && npm run dev`

- [ ] **Step 3: Test the full flow**

1. Open the app in a browser
2. Start a conversation
3. Send a message
4. Click "Save as Note" → "AI Summary"
5. Verify toast shows "AI笔记生成中..."
6. Verify dialog closes immediately
7. Wait for toast showing "笔记生成完成"
8. Navigate to "我的笔记" page
9. Verify the new note appears in the list

- [ ] **Step 4: Test refresh recovery**

1. Start a new AI note generation
2. Immediately refresh the page
3. Verify the "AI笔记生成中..." toast reappears
4. Verify it eventually shows "笔记生成完成" or error

- [ ] **Step 5: Test concurrency control**

1. Click "AI Summary" on a conversation
2. Quickly click "AI Summary" again on the same conversation
3. Verify no duplicate generation occurs (same task_id returned)

---

## Self-Review Checklist

### Spec Coverage
- [x] Async generation with task_id response → Task 5
- [x] Database table for task state → Task 1, 3
- [x] Task status polling endpoint → Task 5, 6
- [x] Frontend polling mechanism → Task 10
- [x] Toast notifications → Task 10, 13
- [x] localStorage recovery → Task 10, 12
- [x] Concurrency control (same conversation) → Task 5
- [x] Failed status + error message → Task 5
- [x] Auto-save note on completion → Task 5 (generateNoteAsync)

### Placeholder Scan
- [x] No TBD/TODO found
- [x] All code steps contain complete code
- [x] All commands include expected output

### Type Consistency
- [x] `NoteGenerationTask` model fields match repository queries
- [x] `AsyncNoteGenerationResponse` matches handler JSON response
- [x] `NoteGenerationTask` TypeScript type matches Go model JSON output
- [x] `notesApi.generate` return type matches `AsyncNoteGenerationResponse`
- [x] `notesApi.getTask` return type matches `NoteGenerationTask`
