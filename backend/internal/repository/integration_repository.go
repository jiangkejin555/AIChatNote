package repository

import (
	"errors"

	"github.com/chat-note/backend/internal/database"
	"github.com/chat-note/backend/internal/models"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type IntegrationRepository interface {
	GetByUserIDAndProvider(userID uint, provider string) (*models.Integration, error)
	CreateOrUpdate(integration *models.Integration) error
	Delete(userID uint, provider string) error
}

type integrationRepository struct{}

func NewIntegrationRepository() IntegrationRepository {
	return &integrationRepository{}
}

func (r *integrationRepository) GetByUserIDAndProvider(userID uint, provider string) (*models.Integration, error) {
	var integration models.Integration
	err := database.DB.Where("user_id = ? AND provider = ?", userID, provider).First(&integration).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // Return nil, nil when not found
		}
		return nil, err
	}
	return &integration, nil
}

func (r *integrationRepository) CreateOrUpdate(integration *models.Integration) error {
	return database.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "provider"}},
		UpdateAll: true,
	}).Create(integration).Error
}

func (r *integrationRepository) Delete(userID uint, provider string) error {
	return database.DB.Where("user_id = ? AND provider = ?", userID, provider).Delete(&models.Integration{}).Error
}
