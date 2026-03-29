package repository

import (
	"time"

	"github.com/chat-note/backend/internal/database"
	"github.com/chat-note/backend/internal/models"
	"gorm.io/gorm"
)

type NoteRepository struct{}

func NewNoteRepository() *NoteRepository {
	return &NoteRepository{}
}

func (r *NoteRepository) Create(note *models.Note) error {
	return database.DB.Create(note).Error
}

func (r *NoteRepository) FindByUserID(userID uint, filters map[string]interface{}) ([]models.Note, error) {
	var notes []models.Note
	query := database.DB.Where("user_id = ?", userID)

	if folderID, ok := filters["folder_id"]; ok {
		query = query.Where("folder_id = ?", folderID)
	}
	if tag, ok := filters["tag"]; ok {
		query = query.Joins("JOIN note_tags ON note_tags.note_id = notes.id").
			Where("note_tags.tag = ?", tag)
	}
	if search, ok := filters["search"]; ok {
		// query = query.Where("search_vector @@ to_tsquery('simple', ?)", search)
		// Use ILIKE for better Chinese text support
		// PostgreSQL's 'simple' tsvector config doesn't properly segment Chinese text
		searchPattern := "%" + search.(string) + "%"
		query = query.Where("title ILIKE ? OR content ILIKE ?", searchPattern, searchPattern)
	}

	err := query.Preload("Tags").Order("updated_at DESC").Find(&notes).Error
	return notes, err
}

func (r *NoteRepository) FindByID(id uint) (*models.Note, error) {
	var note models.Note
	err := database.DB.Preload("Tags").First(&note, id).Error
	if err != nil {
		return nil, err
	}
	return &note, nil
}

func (r *NoteRepository) FindByIDAndUserID(id, userID uint) (*models.Note, error) {
	var note models.Note
	err := database.DB.Where("id = ? AND user_id = ?", id, userID).
		Preload("Tags").
		First(&note).Error
	if err != nil {
		return nil, err
	}
	return &note, nil
}

func (r *NoteRepository) Update(note *models.Note) error {
	return database.DB.Save(note).Error
}

func (r *NoteRepository) UpdateNotionStatus(noteID uint, notionPageID *string, lastSyncAt *time.Time) error {
	return database.DB.Model(&models.Note{}).Where("id = ?", noteID).Updates(map[string]interface{}{
		"notion_page_id":      notionPageID,
		"notion_last_sync_at": lastSyncAt,
	}).Error
}

func (r *NoteRepository) Delete(id, userID uint) error {
	return database.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Note{}).Error
}

func (r *NoteRepository) DeleteTags(noteID uint) error {
	return database.DB.Where("note_id = ?", noteID).Delete(&models.NoteTag{}).Error
}

func (r *NoteRepository) CreateTags(tags []models.NoteTag) error {
	return database.DB.Create(&tags).Error
}

// CreateWithTags creates a note with tags in a single transaction
func (r *NoteRepository) CreateWithTags(note *models.Note, tags []models.NoteTag) error {
	return database.DB.Transaction(func(tx *gorm.DB) error {
		// Create note first
		if err := tx.Create(note).Error; err != nil {
			return err
		}

		// Create tags if any
		if len(tags) > 0 {
			// Update tags with the note ID
			for i := range tags {
				tags[i].NoteID = note.ID
			}
			if err := tx.Create(&tags).Error; err != nil {
				return err
			}
			note.Tags = tags
		}

		return nil
	})
}

// UpdateWithTags updates a note with tags in a single transaction
func (r *NoteRepository) UpdateWithTags(note *models.Note, tags []models.NoteTag) error {
	return database.DB.Transaction(func(tx *gorm.DB) error {
		// Update note
		if err := tx.Save(note).Error; err != nil {
			return err
		}

		// Delete existing tags
		if err := tx.Where("note_id = ?", note.ID).Delete(&models.NoteTag{}).Error; err != nil {
			return err
		}

		// Create new tags if any
		if len(tags) > 0 {
			for i := range tags {
				tags[i].NoteID = note.ID
			}
			if err := tx.Create(&tags).Error; err != nil {
				return err
			}
			note.Tags = tags
		} else {
			note.Tags = nil
		}

		return nil
	})
}

func (r *NoteRepository) BatchDelete(ids []uint, userID uint) error {
	return database.DB.Where("id IN ? AND user_id = ?", ids, userID).Delete(&models.Note{}).Error
}

func (r *NoteRepository) BatchMove(ids []uint, userID uint, folderID *uint) error {
	return database.DB.Model(&models.Note{}).
		Where("id IN ? AND user_id = ?", ids, userID).
		Update("folder_id", folderID).Error
}

type FolderRepository struct{}

func NewFolderRepository() *FolderRepository {
	return &FolderRepository{}
}

func (r *FolderRepository) Create(folder *models.Folder) error {
	return database.DB.Create(folder).Error
}

func (r *FolderRepository) FindByUserID(userID uint) ([]models.Folder, error) {
	var folders []models.Folder
	err := database.DB.Where("user_id = ?", userID).Find(&folders).Error
	return folders, err
}

func (r *FolderRepository) FindByID(id uint) (*models.Folder, error) {
	var folder models.Folder
	err := database.DB.First(&folder, id).Error
	if err != nil {
		return nil, err
	}
	return &folder, nil
}

func (r *FolderRepository) FindByIDAndUserID(id, userID uint) (*models.Folder, error) {
	var folder models.Folder
	err := database.DB.Where("id = ? AND user_id = ?", id, userID).First(&folder).Error
	if err != nil {
		return nil, err
	}
	return &folder, nil
}

func (r *FolderRepository) Update(folder *models.Folder) error {
	return database.DB.Save(folder).Error
}

func (r *FolderRepository) Delete(id, userID uint) error {
	return database.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Folder{}).Error
}

func (r *FolderRepository) GetNotesInFolder(folderID uint) ([]models.Note, error) {
	var notes []models.Note
	err := database.DB.Where("folder_id = ?", folderID).Find(&notes).Error
	return notes, err
}

func (r *FolderRepository) GetSubfolders(parentID uint) ([]models.Folder, error) {
	var folders []models.Folder
	err := database.DB.Where("parent_id = ?", parentID).Find(&folders).Error
	return folders, err
}

type TagRepository struct{}

func NewTagRepository() *TagRepository {
	return &TagRepository{}
}

func (r *TagRepository) FindByUserID(userID uint) ([]models.Tag, error) {
	var tags []models.Tag
	err := database.DB.Table("note_tags").
		Select("note_tags.tag as name, COUNT(*) as count").
		Joins("JOIN notes ON notes.id = note_tags.note_id").
		Where("notes.user_id = ?", userID).
		Group("note_tags.tag").
		Order("count DESC").
		Find(&tags).Error
	return tags, err
}

func (r *TagRepository) FindByNoteID(noteID uint) ([]string, error) {
	var tags []string
	err := database.DB.Model(&models.NoteTag{}).
		Where("note_id = ?", noteID).
		Pluck("tag", &tags).Error
	return tags, err
}
