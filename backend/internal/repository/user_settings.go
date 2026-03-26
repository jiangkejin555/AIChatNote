package repository

import (
	"errors"

	"github.com/chat-note/backend/internal/database"
	"github.com/chat-note/backend/internal/models"
	"gorm.io/gorm"
)

var ErrUserSettingsNotFound = errors.New("user settings not found")

type UserSettingsRepository struct{}

func NewUserSettingsRepository() *UserSettingsRepository {
	return &UserSettingsRepository{}
}

// FindByUserID finds user settings by user ID
func (r *UserSettingsRepository) FindByUserID(userID uint) (*models.UserSettings, error) {
	var settings models.UserSettings
	err := database.DB.Where("user_id = ?", userID).First(&settings).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserSettingsNotFound
		}
		return nil, err
	}
	return &settings, nil
}

// Create creates new user settings
func (r *UserSettingsRepository) Create(settings *models.UserSettings) error {
	return database.DB.Create(settings).Error
}

// Upsert creates or updates user settings
func (r *UserSettingsRepository) Upsert(settings *models.UserSettings) error {
	var existing models.UserSettings
	err := database.DB.Where("user_id = ?", settings.UserID).First(&existing).Error

	if err != nil {
		// Record doesn't exist, create new
		return database.DB.Create(settings).Error
	}

	// Update existing record
	existing.ContextMode = settings.ContextMode
	existing.MemoryLevel = settings.MemoryLevel
	return database.DB.Save(&existing).Error
}

// GetOrCreate returns user settings, creating with defaults if not exists
func (r *UserSettingsRepository) GetOrCreate(userID uint, defaultMode models.ContextMode, defaultLevel models.MemoryLevel) (*models.UserSettings, error) {
	settings, err := r.FindByUserID(userID)
	if err == nil {
		return settings, nil
	}

	if !errors.Is(err, ErrUserSettingsNotFound) {
		return nil, err
	}

	// Create new settings with defaults
	newSettings := &models.UserSettings{
		UserID:      userID,
		ContextMode: defaultMode,
		MemoryLevel: defaultLevel,
	}

	if err := r.Create(newSettings); err != nil {
		return nil, err
	}

	return newSettings, nil
}
