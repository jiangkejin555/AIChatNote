package handlers

import (
	"archive/zip"
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/chat-note/backend/internal/middleware"
	"github.com/chat-note/backend/internal/models"
	"github.com/chat-note/backend/internal/repository"
	"github.com/chat-note/backend/internal/services"
	"github.com/chat-note/backend/internal/utils"
	"github.com/gin-gonic/gin"
)

type NoteHandler struct {
	noteRepo   *repository.NoteRepository
	folderRepo *repository.FolderRepository
	tagRepo    *repository.TagRepository
	convRepo   *repository.ConversationRepository
	aiService  *services.AIService
	taskRepo   *repository.NoteGenerationTaskRepository
}

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

type CreateNoteRequest struct {
	Title                string   `json:"title" binding:"required"`
	Content              string   `json:"content" binding:"required"`
	Tags                 []string `json:"tags"`
	FolderID             *uint    `json:"folder_id"`
	SourceConversationID *uint    `json:"source_conversation_id"`
}

type UpdateNoteRequest struct {
	Title    string   `json:"title"`
	Content  string   `json:"content"`
	Tags     []string `json:"tags"`
	FolderID *uint    `json:"folder_id"`
}

type BatchDeleteRequest struct {
	IDs []uint `json:"ids" binding:"required"`
}

type BatchMoveRequest struct {
	IDs            []uint `json:"ids" binding:"required"`
	TargetFolderID *uint  `json:"target_folder_id"`
}

// List returns notes with optional filters
func (h *NoteHandler) List(c *gin.Context) {
	userID := middleware.GetUserID(c)

	filters := make(map[string]interface{})
	if folderID := c.Query("folder_id"); folderID != "" {
		if id, err := strconv.ParseUint(folderID, 10, 32); err == nil {
			filters["folder_id"] = uint(id)
		}
	}
	if tag := c.Query("tag"); tag != "" {
		filters["tag"] = tag
	}
	if search := c.Query("search"); search != "" {
		filters["search"] = search
	}

	notes, err := h.noteRepo.FindByUserID(userID, filters)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "db_error", "Failed to fetch notes", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": notes})
}

// Create creates a new note
func (h *NoteHandler) Create(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req CreateNoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	note := &models.Note{
		UserID:               userID,
		Title:                req.Title,
		Content:              req.Content,
		FolderID:             req.FolderID,
		SourceConversationID: req.SourceConversationID,
	}

	// Build tags slice
	var tags []models.NoteTag
	if len(req.Tags) > 0 {
		tags = make([]models.NoteTag, len(req.Tags))
		for i, tag := range req.Tags {
			tags[i] = models.NoteTag{Tag: tag}
		}
	}

	// Create note with tags in a single transaction
	if err := h.noteRepo.CreateWithTags(note, tags); err != nil {
		utils.LogOperationError("NoteHandler", "Create", err, "userID", userID, "title", req.Title, "tagCount", len(req.Tags))
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "create_error", "Failed to create note", err)
		return
	}

	utils.LogOperationSuccess("NoteHandler", "Create", "noteID", note.ID, "userID", userID, "title", note.Title, "tagCount", len(req.Tags))

	c.JSON(http.StatusCreated, gin.H{"data": note})
}

// Get returns a specific note
func (h *NoteHandler) Get(c *gin.Context) {
	userID := middleware.GetUserID(c)
	noteID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid note ID")
		return
	}

	note, err := h.noteRepo.FindByIDAndUserID(uint(noteID), userID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusNotFound, "not_found", "Note not found", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": note})
}

// Update updates a note
func (h *NoteHandler) Update(c *gin.Context) {
	userID := middleware.GetUserID(c)
	noteID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid note ID")
		return
	}

	note, err := h.noteRepo.FindByIDAndUserID(uint(noteID), userID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusNotFound, "not_found", "Note not found", err)
		return
	}

	var req UpdateNoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	if req.Title != "" {
		note.Title = req.Title
	}
	if req.Content != "" {
		note.Content = req.Content
	}
	if req.FolderID != nil {
		note.FolderID = req.FolderID
	}

	// If tags are provided, use transaction to update note and tags together
	if req.Tags != nil {
		var tags []models.NoteTag
		if len(req.Tags) > 0 {
			tags = make([]models.NoteTag, len(req.Tags))
			for i, tag := range req.Tags {
				tags[i] = models.NoteTag{Tag: tag}
			}
		}

		if err := h.noteRepo.UpdateWithTags(note, tags); err != nil {
			utils.LogOperationError("NoteHandler", "Update", err, "noteID", noteID, "userID", userID, "tagCount", len(req.Tags))
			utils.SendErrorWithErr(c, http.StatusInternalServerError, "update_error", "Failed to update note", err)
			return
		}
	} else {
		// Only update note without touching tags
		if err := h.noteRepo.Update(note); err != nil {
			utils.LogOperationError("NoteHandler", "Update", err, "noteID", noteID, "userID", userID)
			utils.SendErrorWithErr(c, http.StatusInternalServerError, "update_error", "Failed to update note", err)
			return
		}
	}

	utils.LogOperationSuccess("NoteHandler", "Update", "noteID", note.ID, "userID", userID, "title", note.Title)
	c.JSON(http.StatusOK, gin.H{"data": note})
}

// Delete deletes a note
func (h *NoteHandler) Delete(c *gin.Context) {
	userID := middleware.GetUserID(c)
	noteID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid note ID")
		return
	}

	if err := h.noteRepo.Delete(uint(noteID), userID); err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "delete_error", "Failed to delete note", err)
		return
	}

	utils.LogOperationSuccess("NoteHandler", "Delete", "noteID", noteID, "userID", userID)
	c.JSON(http.StatusOK, gin.H{"message": "Note deleted"})
}

// Copy copies a note
func (h *NoteHandler) Copy(c *gin.Context) {
	userID := middleware.GetUserID(c)
	noteID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid note ID")
		return
	}

	note, err := h.noteRepo.FindByIDAndUserID(uint(noteID), userID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusNotFound, "not_found", "Note not found", err)
		return
	}

	newNote := &models.Note{
		UserID:               userID,
		Title:                note.Title + " - Copy",
		Content:              note.Content,
		FolderID:             note.FolderID,
		SourceConversationID: note.SourceConversationID,
	}

	if err := h.noteRepo.Create(newNote); err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "create_error", "Failed to copy note", err)
		return
	}

	// Copy tags using transaction
	if len(note.Tags) > 0 {
		tags := make([]models.NoteTag, len(note.Tags))
		for i, tag := range note.Tags {
			tags[i] = models.NoteTag{Tag: tag.Tag}
		}
		if err := h.noteRepo.CreateTags(tags); err != nil {
			utils.LogOperationError("NoteHandler", "Copy", err, "sourceNoteID", noteID, "userID", userID, "step", "copy_tags")
			utils.SendErrorWithErr(c, http.StatusInternalServerError, "copy_error", "Failed to copy note tags", err)
			return
		}
		newNote.Tags = tags
	}

	utils.LogOperationSuccess("NoteHandler", "Copy", "sourceNoteID", noteID, "newNoteID", newNote.ID, "userID", userID, "title", newNote.Title)
	c.JSON(http.StatusOK, gin.H{"data": newNote})
}

// Export exports a single note as Markdown
func (h *NoteHandler) Export(c *gin.Context) {
	userID := middleware.GetUserID(c)
	noteID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid note ID")
		return
	}

	note, err := h.noteRepo.FindByIDAndUserID(uint(noteID), userID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusNotFound, "not_found", "Note not found", err)
		return
	}

	// Build markdown content
	var tagsStr string
	for _, tag := range note.Tags {
		tagsStr += "#" + tag.Tag + " "
	}

	markdown := fmt.Sprintf("# %s\n\n%s", note.Title, note.Content)
	if tagsStr != "" {
		markdown = fmt.Sprintf("# %s\n\n%s\n\n%s", note.Title, note.Content, tagsStr)
	}

	filename := sanitizeFilename(note.Title) + ".md"
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	c.Data(http.StatusOK, "text/markdown", []byte(markdown))
}

// ExportBatch exports multiple notes as ZIP
func (h *NoteHandler) ExportBatch(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req struct {
		IDs []uint `json:"ids"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	notes, err := h.noteRepo.FindByUserID(userID, nil)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "db_error", "Failed to fetch notes", err)
		return
	}

	// Filter notes if IDs provided
	if len(req.IDs) > 0 {
		idSet := make(map[uint]bool)
		for _, id := range req.IDs {
			idSet[id] = true
		}
		var filtered []models.Note
		for _, note := range notes {
			if idSet[note.ID] {
				filtered = append(filtered, note)
			}
		}
		notes = filtered
	}

	// Create ZIP
	buf := new(bytes.Buffer)
	zipWriter := zip.NewWriter(buf)

	for _, note := range notes {
		filename := sanitizeFilename(note.Title) + ".md"
		markdown := fmt.Sprintf("# %s\n\n%s", note.Title, note.Content)

		w, _ := zipWriter.Create(filename)
		w.Write([]byte(markdown))
	}

	zipWriter.Close()

	c.Header("Content-Disposition", "attachment; filename=notes_export.zip")
	c.Data(http.StatusOK, "application/zip", buf.Bytes())
}

// Import imports a Markdown file
func (h *NoteHandler) Import(c *gin.Context) {
	userID := middleware.GetUserID(c)

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "no_file", "No file uploaded")
		return
	}
	defer file.Close()

	content, err := io.ReadAll(file)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "read_error", "Failed to read file", err)
		return
	}

	// Parse markdown
	title := strings.TrimSuffix(header.Filename, ".md")
	body := string(content)

	// Try to extract title from first H1
	re := regexp.MustCompile(`(?m)^#\s+(.+)$`)
	if matches := re.FindStringSubmatch(body); len(matches) > 1 {
		title = matches[1]
		body = re.ReplaceAllString(body, "")
		body = strings.TrimSpace(body)
	}

	folderIDStr := c.PostForm("folder_id")
	var folderID *uint
	if folderIDStr != "" {
		if id, err := strconv.ParseUint(folderIDStr, 10, 32); err == nil {
			fid := uint(id)
			folderID = &fid
		}
	}

	note := &models.Note{
		UserID:   userID,
		Title:    title,
		Content:  body,
		FolderID: folderID,
	}

	if err := h.noteRepo.Create(note); err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "create_error", "Failed to create note", err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": note})
}

// BatchDelete deletes multiple notes
func (h *NoteHandler) BatchDelete(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req BatchDeleteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	if err := h.noteRepo.BatchDelete(req.IDs, userID); err != nil {
		utils.LogOperationError("NoteHandler", "BatchDelete", err, "userID", userID, "count", len(req.IDs))
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "delete_error", "Failed to delete notes", err)
		return
	}

	utils.LogOperationSuccess("NoteHandler", "BatchDelete", "userID", userID, "count", len(req.IDs))
	c.JSON(http.StatusOK, gin.H{"message": "Notes deleted"})
}

// BatchMove moves multiple notes to a folder
func (h *NoteHandler) BatchMove(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req BatchMoveRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	if err := h.noteRepo.BatchMove(req.IDs, userID, req.TargetFolderID); err != nil {
		utils.LogOperationError("NoteHandler", "BatchMove", err, "userID", userID, "count", len(req.IDs), "targetFolderID", req.TargetFolderID)
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "move_error", "Failed to move notes", err)
		return
	}

	utils.LogOperationSuccess("NoteHandler", "BatchMove", "userID", userID, "count", len(req.IDs), "targetFolderID", req.TargetFolderID)
	c.JSON(http.StatusOK, gin.H{"message": "Notes moved"})
}

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

func sanitizeFilename(name string) string {
	// Remove invalid characters
	re := regexp.MustCompile(`[<>:"/\\|?*]`)
	name = re.ReplaceAllString(name, "")
	if name == "" {
		name = "untitled"
	}
	return name
}

// FolderHandler handles folder operations
type FolderHandler struct {
	folderRepo *repository.FolderRepository
	noteRepo   *repository.NoteRepository
}

func NewFolderHandler() *FolderHandler {
	return &FolderHandler{
		folderRepo: repository.NewFolderRepository(),
		noteRepo:   repository.NewNoteRepository(),
	}
}

// List returns all folders as a flat array
func (h *FolderHandler) List(c *gin.Context) {
	userID := middleware.GetUserID(c)

	folders, err := h.folderRepo.FindByUserID(userID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "db_error", "Failed to fetch folders", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": folders})
}

// Create creates a new folder
func (h *FolderHandler) Create(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req struct {
		Name     string `json:"name" binding:"required"`
		ParentID *uint  `json:"parent_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	folder := &models.Folder{
		UserID:   userID,
		Name:     req.Name,
		ParentID: req.ParentID,
	}

	if err := h.folderRepo.Create(folder); err != nil {
		utils.LogOperationError("FolderHandler", "Create", err, "userID", userID, "name", req.Name)
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "create_error", "Failed to create folder", err)
		return
	}

	utils.LogOperationSuccess("FolderHandler", "Create", "folderID", folder.ID, "userID", userID, "name", folder.Name)
	c.JSON(http.StatusCreated, gin.H{"data": folder})
}

// Get returns a specific folder
func (h *FolderHandler) Get(c *gin.Context) {
	userID := middleware.GetUserID(c)
	folderID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid folder ID")
		return
	}

	folder, err := h.folderRepo.FindByIDAndUserID(uint(folderID), userID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusNotFound, "not_found", "Folder not found", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": folder})
}

// Update updates a folder
func (h *FolderHandler) Update(c *gin.Context) {
	userID := middleware.GetUserID(c)
	folderID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid folder ID")
		return
	}

	folder, err := h.folderRepo.FindByIDAndUserID(uint(folderID), userID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusNotFound, "not_found", "Folder not found", err)
		return
	}

	var req struct {
		Name     string `json:"name"`
		ParentID *uint  `json:"parent_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	if req.Name != "" {
		folder.Name = req.Name
	}
	if req.ParentID != nil {
		folder.ParentID = req.ParentID
	}

	if err := h.folderRepo.Update(folder); err != nil {
		utils.LogOperationError("FolderHandler", "Update", err, "folderID", folderID, "userID", userID)
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "update_error", "Failed to update folder", err)
		return
	}

	utils.LogOperationSuccess("FolderHandler", "Update", "folderID", folder.ID, "userID", userID, "name", folder.Name)
	c.JSON(http.StatusOK, gin.H{"data": folder})
}

// Delete deletes a folder
func (h *FolderHandler) Delete(c *gin.Context) {
	userID := middleware.GetUserID(c)
	folderID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid folder ID")
		return
	}

	// Move notes to root
	notes, _ := h.noteRepo.FindByUserID(userID, map[string]interface{}{"folder_id": uint(folderID)})
	noteCount := len(notes)
	for _, note := range notes {
		note.FolderID = nil
		h.noteRepo.Update(&note)
	}

	if err := h.folderRepo.Delete(uint(folderID), userID); err != nil {
		utils.LogOperationError("FolderHandler", "Delete", err, "folderID", folderID, "userID", userID)
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "delete_error", "Failed to delete folder", err)
		return
	}

	utils.LogOperationSuccess("FolderHandler", "Delete", "folderID", folderID, "userID", userID, "notesMovedToRoot", noteCount)
	c.JSON(http.StatusOK, gin.H{"message": "Folder deleted"})
}

// Copy copies a folder
func (h *FolderHandler) Copy(c *gin.Context) {
	userID := middleware.GetUserID(c)
	folderID, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid folder ID")
		return
	}

	folder, err := h.folderRepo.FindByIDAndUserID(uint(folderID), userID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusNotFound, "not_found", "Folder not found", err)
		return
	}

	newFolder := &models.Folder{
		UserID:   userID,
		Name:     folder.Name + " - Copy",
		ParentID: folder.ParentID,
	}

	if err := h.folderRepo.Create(newFolder); err != nil {
		utils.LogOperationError("FolderHandler", "Copy", err, "sourceFolderID", folderID, "userID", userID)
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "create_error", "Failed to copy folder", err)
		return
	}

	// Copy notes
	notes, _ := h.noteRepo.FindByUserID(userID, map[string]interface{}{"folder_id": folder.ID})
	for _, note := range notes {
		newNote := &models.Note{
			UserID:   userID,
			Title:    note.Title,
			Content:  note.Content,
			FolderID: &newFolder.ID,
		}
		h.noteRepo.Create(newNote)
	}

	utils.LogOperationSuccess("FolderHandler", "Copy", "sourceFolderID", folderID, "newFolderID", newFolder.ID, "userID", userID, "notesCopied", len(notes))
	c.JSON(http.StatusOK, gin.H{"data": newFolder})
}

// TagHandler handles tag operations
type TagHandler struct {
	tagRepo *repository.TagRepository
}

func NewTagHandler() *TagHandler {
	return &TagHandler{tagRepo: repository.NewTagRepository()}
}

// List returns all tags with counts
func (h *TagHandler) List(c *gin.Context) {
	userID := middleware.GetUserID(c)

	tags, err := h.tagRepo.FindByUserID(userID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "db_error", "Failed to fetch tags", err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": tags})
}
