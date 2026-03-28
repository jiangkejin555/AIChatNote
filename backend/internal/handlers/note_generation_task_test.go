package handlers

import (
	"encoding/json"
	"fmt"
	"testing"
	"time"

	"github.com/chat-note/backend/internal/config"
	"github.com/chat-note/backend/internal/crypto"
	"github.com/chat-note/backend/internal/database"
	"github.com/chat-note/backend/internal/middleware"
	"github.com/chat-note/backend/internal/models"
	"github.com/chat-note/backend/internal/services"
	"github.com/chat-note/backend/internal/testutil"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupNoteGenerationTestRouter(t *testing.T) (*gin.Engine, *config.Config, func()) {
	t.Helper()
	gin.SetMode(gin.TestMode)
	cleanup := testutil.SetupTestDB(t)

	cfg := testutil.TestConfig()
	jwtService := crypto.NewJWTService(cfg)
	aiService := services.NewAIService(true)
	noteHandler := NewNoteHandler(aiService)

	router := gin.New()
	api := router.Group("/api")
	notes := api.Group("/notes")
	notes.Use(middleware.Auth(jwtService))
	{
		notes.POST("/generate", noteHandler.Generate)
		notes.GET("/tasks/:id", noteHandler.GetTask)
	}

	return router, cfg, cleanup
}

func TestGenerate_Success(t *testing.T) {
	router, cfg, cleanup := setupNoteGenerationTestRouter(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "gen_success@example.com", "hash")
	conv := testutil.CreateTestConversation(t, user.ID, "Test Conversation")

	// Trigger generation
	body := fmt.Sprintf(`{"conversation_id": %d}`, conv.ID)
	w := testutil.MakeAuthenticatedRequest(router, "POST", "/api/notes/generate", body, user.ID, cfg)
	require.Equal(t, 200, w.Code)

	var genResp map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &genResp)
	require.NoError(t, err)
	data := genResp["data"].(map[string]interface{})
	taskID := data["task_id"]
	assert.NotNil(t, taskID)

	// Wait for async generation to complete (mock mode is instant)
	time.Sleep(500 * time.Millisecond)

	// Check task status
	taskURL := fmt.Sprintf("/api/notes/tasks/%v", taskID)
	w = testutil.MakeAuthenticatedRequest(router, "GET", taskURL, nil, user.ID, cfg)
	require.Equal(t, 200, w.Code)

	var taskResp map[string]interface{}
	err = json.Unmarshal(w.Body.Bytes(), &taskResp)
	require.NoError(t, err)
	taskData := taskResp["data"].(map[string]interface{})
	assert.Equal(t, "done", taskData["status"])
	assert.NotNil(t, taskData["note_id"])
}

func TestGenerate_ConcurrencyControl(t *testing.T) {
	router, cfg, cleanup := setupNoteGenerationTestRouter(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "gen_concurrency@example.com", "hash")
	conv := testutil.CreateTestConversation(t, user.ID, "Test Conversation")

	// Pre-insert a task with "generating" status to simulate an in-progress task.
	// In mock mode the goroutine finishes instantly, so we can't rely on timing.
	// Instead, directly seed the DB so the concurrency-control path is exercised.
	existingTask := &models.NoteGenerationTask{
		UserID:         user.ID,
		ConversationID: conv.ID,
		Status:         models.TaskStatusGenerating,
	}
	require.NoError(t, database.DB.Create(existingTask).Error)

	body := fmt.Sprintf(`{"conversation_id": %d}`, conv.ID)

	// Both requests should find the existing "generating" task and return its ID
	w1 := testutil.MakeAuthenticatedRequest(router, "POST", "/api/notes/generate", body, user.ID, cfg)
	require.Equal(t, 200, w1.Code)

	var resp1 map[string]interface{}
	err := json.Unmarshal(w1.Body.Bytes(), &resp1)
	require.NoError(t, err)
	data1 := resp1["data"].(map[string]interface{})
	taskID1 := data1["task_id"]

	w2 := testutil.MakeAuthenticatedRequest(router, "POST", "/api/notes/generate", body, user.ID, cfg)
	require.Equal(t, 200, w2.Code)

	var resp2 map[string]interface{}
	err = json.Unmarshal(w2.Body.Bytes(), &resp2)
	require.NoError(t, err)
	data2 := resp2["data"].(map[string]interface{})
	taskID2 := data2["task_id"]

	assert.Equal(t, taskID1, taskID2, "duplicate requests should return the same task_id")
	// Verify it's the pre-inserted task
	assert.Equal(t, float64(existingTask.ID), taskID1, "should return the existing generating task")
}

func TestGetTask_NotFound(t *testing.T) {
	router, cfg, cleanup := setupNoteGenerationTestRouter(t)
	defer cleanup()

	user := testutil.CreateTestUser(t, "gen_notfound@example.com", "hash")

	w := testutil.MakeAuthenticatedRequest(router, "GET", "/api/notes/tasks/99999", nil, user.ID, cfg)
	assert.Equal(t, 404, w.Code)
}

func TestGetTask_UnauthorizedAccess(t *testing.T) {
	router, cfg, cleanup := setupNoteGenerationTestRouter(t)
	defer cleanup()

	user1 := testutil.CreateTestUser(t, "gen_owner@example.com", "hash")
	user2 := testutil.CreateTestUser(t, "gen_intruder@example.com", "hash")
	conv := testutil.CreateTestConversation(t, user1.ID, "Owner Conversation")

	// User1 triggers generation
	body := fmt.Sprintf(`{"conversation_id": %d}`, conv.ID)
	w := testutil.MakeAuthenticatedRequest(router, "POST", "/api/notes/generate", body, user1.ID, cfg)
	require.Equal(t, 200, w.Code)

	var genResp map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &genResp)
	require.NoError(t, err)
	data := genResp["data"].(map[string]interface{})
	taskID := data["task_id"]

	// User2 tries to access user1's task
	taskURL := fmt.Sprintf("/api/notes/tasks/%v", taskID)
	w = testutil.MakeAuthenticatedRequest(router, "GET", taskURL, nil, user2.ID, cfg)
	assert.Equal(t, 404, w.Code, "user2 should not see user1's task")

	// Wait for the async goroutine to finish before cleanup closes the test DB
	time.Sleep(200 * time.Millisecond)
}
