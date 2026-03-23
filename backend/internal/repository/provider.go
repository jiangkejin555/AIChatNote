package repository

import (
	"github.com/chat-note/backend/internal/database"
	"github.com/chat-note/backend/internal/models"
	"github.com/google/uuid"
)

type ProviderRepository struct{}

func NewProviderRepository() *ProviderRepository {
	return &ProviderRepository{}
}

func (r *ProviderRepository) Create(provider *models.Provider) error {
	return database.DB.Create(provider).Error
}

func (r *ProviderRepository) FindByUserID(userID uint) ([]models.Provider, error) {
	var providers []models.Provider
	err := database.DB.Where("user_id = ?", userID).
		Preload("Models").
		Order("created_at DESC").
		Find(&providers).Error
	return providers, err
}

func (r *ProviderRepository) FindByID(id uuid.UUID) (*models.Provider, error) {
	var provider models.Provider
	err := database.DB.Where("id = ?", id).
		Preload("Models").
		First(&provider).Error
	if err != nil {
		return nil, err
	}
	return &provider, nil
}

func (r *ProviderRepository) FindByIDAndUserID(id uuid.UUID, userID uint) (*models.Provider, error) {
	var provider models.Provider
	err := database.DB.Where("id = ? AND user_id = ?", id, userID).
		Preload("Models").
		First(&provider).Error
	if err != nil {
		return nil, err
	}
	return &provider, nil
}

func (r *ProviderRepository) Update(provider *models.Provider) error {
	return database.DB.Save(provider).Error
}

func (r *ProviderRepository) Delete(id uuid.UUID, userID uint) error {
	return database.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Provider{}).Error
}
