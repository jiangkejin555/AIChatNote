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
