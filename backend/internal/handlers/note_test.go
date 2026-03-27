package handlers

import (
	"encoding/json"
	"fmt"
	"testing"

	"github.com/chat-note/backend/internal/config"
	"github.com/chat-note/backend/internal/crypto"
	"github.com/chat-note/backend/internal/database"
	"github.com/chat-note/backend/internal/middleware"
	"github.com/chat-note/backend/internal/models"
	"github.com/chat-note/backend/internal/repository"
	"github.com/chat-note/backend/internal/services"
	"github.com/chat-note/backend/internal/testutil"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupNoteTest(t *testing.T) (*gin.Engine, *config.Config, func()) {
	gin.SetMode(gin.TestMode)
	cleanup := testutil.SetupTestDB(t)

	cfg := testutil.TestConfig()
	jwtService := crypto.NewJWTService(cfg)
	_ = cfg.Encryption.Key

	verificationCodeSvc := services.NewVerificationCodeService()
	emailSvc := services.NewEmailService(&config.SMTPConfig{})
	authHandler := NewAuthHandler(jwtService, verificationCodeSvc, emailSvc)
	aiService := services.NewAIService(true)
	noteHandler := NewNoteHandler(aiService)
	folderHandler := NewFolderHandler()
	tagHandler := NewTagHandler()

	router := gin.New()

	// Auth routes
	router.POST("/api/auth/register", authHandler.Register)
	router.POST("/api/auth/login", authHandler.Login)

	// Protected routes
	protected := router.Group("/api")
	protected.Use(middleware.Auth(jwtService))
	{
		// Notes
		protected.GET("/notes", noteHandler.List)
		protected.POST("/notes", noteHandler.Create)
		protected.GET("/notes/:id", noteHandler.Get)
		protected.PUT("/notes/:id", noteHandler.Update)
		protected.DELETE("/notes/:id", noteHandler.Delete)
		protected.POST("/notes/:id/copy", noteHandler.Copy)
		protected.GET("/notes/:id/export", noteHandler.Export)
		protected.POST("/notes/batch-delete", noteHandler.BatchDelete)
		protected.POST("/notes/batch-move", noteHandler.BatchMove)
		protected.POST("/notes/generate", noteHandler.Generate)
		protected.POST("/notes/import", noteHandler.Import)
		protected.POST("/notes/export", noteHandler.ExportBatch)

		// Folders
		protected.GET("/folders", folderHandler.List)
		protected.POST("/folders", folderHandler.Create)
		protected.GET("/folders/:id", folderHandler.Get)
		protected.PUT("/folders/:id", folderHandler.Update)
		protected.DELETE("/folders/:id", folderHandler.Delete)
		protected.POST("/folders/:id/copy", folderHandler.Copy)

		// Tags
		protected.GET("/tags", tagHandler.List)
	}

	return router, cfg, cleanup
}

func TestNoteHandler_List(t *testing.T) {
	router, cfg, cleanup := setupNoteTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "note_list@example.com", "hash")

	t.Run("should return empty list when no notes", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "GET", "/api/notes", nil, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].([]interface{})
		assert.Empty(t, data)
	})

	t.Run("should return notes for user", func(t *testing.T) {
		// Create notes
		testutil.CreateTestNote(t, user.ID, "Note 1", "Content 1")
		testutil.CreateTestNote(t, user.ID, "Note 2", "Content 2")

		w := testutil.MakeAuthenticatedRequest(router, "GET", "/api/notes", nil, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].([]interface{})
		assert.GreaterOrEqual(t, len(data), 2)
	})

	t.Run("should filter by folder_id", func(t *testing.T) {
		folder := testutil.CreateTestFolder(t, user.ID, "Test Folder")
		testutil.CreateTestNoteWithFolder(t, user.ID, "In Folder", "Content", folder.ID)

		w := testutil.MakeAuthenticatedRequest(router, "GET", fmt.Sprintf("/api/notes?folder_id=%d", folder.ID), nil, user.ID, cfg)

		require.Equal(t, 200, w.Code)
	})
}

func TestNoteHandler_Create(t *testing.T) {
	router, cfg, cleanup := setupNoteTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "note_create@example.com", "hash")

	t.Run("should create note successfully", func(t *testing.T) {
		body := `{"title": "New Note", "content": "Note content"}`
		w := testutil.MakeAuthenticatedRequest(router, "POST", "/api/notes", body, user.ID, cfg)

		require.Equal(t, 201, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].(map[string]interface{})
		assert.Equal(t, "New Note", data["title"])
		assert.NotZero(t, data["id"])
	})

	t.Run("should create note with tags", func(t *testing.T) {
		body := `{"title": "Tagged Note", "content": "Content", "tags": ["work", "important"]}`
		w := testutil.MakeAuthenticatedRequest(router, "POST", "/api/notes", body, user.ID, cfg)

		require.Equal(t, 201, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].(map[string]interface{})
		tags := data["tags"].([]interface{})
		assert.Len(t, tags, 2)
	})

	t.Run("should return error when title is missing", func(t *testing.T) {
		body := `{"content": "No title"}`
		w := testutil.MakeAuthenticatedRequest(router, "POST", "/api/notes", body, user.ID, cfg)

		assert.Equal(t, 400, w.Code)
	})

	t.Run("should return error when content is missing", func(t *testing.T) {
		body := `{"title": "No content"}`
		w := testutil.MakeAuthenticatedRequest(router, "POST", "/api/notes", body, user.ID, cfg)

		assert.Equal(t, 400, w.Code)
	})
}

func TestNoteHandler_Get(t *testing.T) {
	router, cfg, cleanup := setupNoteTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "note_get@example.com", "hash")
	note := testutil.CreateTestNote(t, user.ID, "Get Test", "Content")

	t.Run("should return note by ID", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "GET", fmt.Sprintf("/api/notes/%d", note.ID), nil, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].(map[string]interface{})
		assert.Equal(t, "Get Test", data["title"])
	})

	t.Run("should return error for non-existent note", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "GET", "/api/notes/99999", nil, user.ID, cfg)

		assert.Equal(t, 404, w.Code)
	})

	t.Run("should return error for other user's note", func(t *testing.T) {
		otherUser := testutil.CreateTestUser(t, "other@example.com", "hash")
		otherNote := testutil.CreateTestNote(t, otherUser.ID, "Other Note", "Content")

		w := testutil.MakeAuthenticatedRequest(router, "GET", fmt.Sprintf("/api/notes/%d", otherNote.ID), nil, user.ID, cfg)

		assert.Equal(t, 404, w.Code)
	})
}

func TestNoteHandler_Update(t *testing.T) {
	router, cfg, cleanup := setupNoteTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "note_update@example.com", "hash")
	note := testutil.CreateTestNote(t, user.ID, "Original Title", "Original Content")

	t.Run("should update note title", func(t *testing.T) {
		body := `{"title": "Updated Title"}`
		w := testutil.MakeAuthenticatedRequest(router, "PUT", fmt.Sprintf("/api/notes/%d", note.ID), body, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].(map[string]interface{})
		assert.Equal(t, "Updated Title", data["title"])
	})

	t.Run("should update note content", func(t *testing.T) {
		body := `{"content": "Updated Content"}`
		w := testutil.MakeAuthenticatedRequest(router, "PUT", fmt.Sprintf("/api/notes/%d", note.ID), body, user.ID, cfg)

		require.Equal(t, 200, w.Code)
	})
}

func TestNoteHandler_Delete(t *testing.T) {
	router, cfg, cleanup := setupNoteTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "note_delete@example.com", "hash")

	t.Run("should delete note", func(t *testing.T) {
		note := testutil.CreateTestNote(t, user.ID, "To Delete", "Content")

		w := testutil.MakeAuthenticatedRequest(router, "DELETE", fmt.Sprintf("/api/notes/%d", note.ID), nil, user.ID, cfg)

		require.Equal(t, 200, w.Code)

		// Verify deleted
		var count int64
		database.DB.Model(&models.Note{}).Where("id = ?", note.ID).Count(&count)
		assert.Equal(t, int64(0), count)
	})
}

func TestNoteHandler_Copy(t *testing.T) {
	router, cfg, cleanup := setupNoteTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "note_copy@example.com", "hash")
	note := testutil.CreateTestNote(t, user.ID, "Original", "Content")

	t.Run("should copy note", func(t *testing.T) {
		w := testutil.MakeAuthenticatedRequest(router, "POST", fmt.Sprintf("/api/notes/%d/copy", note.ID), nil, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].(map[string]interface{})
		assert.Contains(t, data["title"], "Copy")
	})
}

func TestNoteHandler_BatchDelete(t *testing.T) {
	router, cfg, cleanup := setupNoteTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "note_batch@example.com", "hash")

	t.Run("should batch delete notes", func(t *testing.T) {
		note1 := testutil.CreateTestNote(t, user.ID, "Batch 1", "Content")
		note2 := testutil.CreateTestNote(t, user.ID, "Batch 2", "Content")

		body := fmt.Sprintf(`{"ids": [%d, %d]}`, note1.ID, note2.ID)

		w := testutil.MakeAuthenticatedRequest(router, "POST", "/api/notes/batch-delete", body, user.ID, cfg)

		require.Equal(t, 200, w.Code)
	})
}

func TestFolderHandler_Create(t *testing.T) {
	router, cfg, cleanup := setupNoteTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "folder_create@example.com", "hash")

	t.Run("should create folder", func(t *testing.T) {
		body := `{"name": "New Folder"}`
		w := testutil.MakeAuthenticatedRequest(router, "POST", "/api/folders", body, user.ID, cfg)

		require.Equal(t, 201, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].(map[string]interface{})
		assert.Equal(t, "New Folder", data["name"])
	})

	t.Run("should create nested folder", func(t *testing.T) {
		parent := testutil.CreateTestFolder(t, user.ID, "Parent")
		body := fmt.Sprintf(`{"name": "Child", "parent_id": %d}`, parent.ID)
		w := testutil.MakeAuthenticatedRequest(router, "POST", "/api/folders", body, user.ID, cfg)

		require.Equal(t, 201, w.Code)
	})
}

func TestFolderHandler_List(t *testing.T) {
	router, cfg, cleanup := setupNoteTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "folder_list@example.com", "hash")

	t.Run("should return folder tree", func(t *testing.T) {
		parent := testutil.CreateTestFolder(t, user.ID, "Parent")
		testutil.CreateTestFolderWithParent(t, user.ID, "Child", parent.ID)

		w := testutil.MakeAuthenticatedRequest(router, "GET", "/api/folders", nil, user.ID, cfg)

		require.Equal(t, 200, w.Code)
		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		data := response["data"].([]interface{})
		assert.GreaterOrEqual(t, len(data), 1)
	})
}

func TestTagHandler_List(t *testing.T) {
	router, cfg, cleanup := setupNoteTest(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "tag_list@example.com", "hash")

	t.Run("should return tags with counts", func(t *testing.T) {
		// Create note with tags
		note := testutil.CreateTestNote(t, user.ID, "Tagged", "Content")
		noteRepo := repository.NewNoteRepository()
		tags := []models.NoteTag{
			{NoteID: note.ID, Tag: "work"},
			{NoteID: note.ID, Tag: "important"},
		}
		noteRepo.CreateTags(tags)

		w := testutil.MakeAuthenticatedRequest(router, "GET", "/api/tags", nil, user.ID, cfg)

		require.Equal(t, 200, w.Code)
	})
}
