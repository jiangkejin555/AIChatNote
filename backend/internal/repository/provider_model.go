package repository

import (
	"github.com/ai-chat-notes/backend/internal/database"
	"github.com/ai-chat-notes/backend/internal/models"
	"github.com/google/uuid"
)

type ProviderModelRepository struct{}

func NewProviderModelRepository() *ProviderModelRepository {
	return &ProviderModelRepository{}
}

func (r *ProviderModelRepository) Create(model *models.ProviderModel) error {
	return database.DB.Create(model).Error
}

func (r *ProviderModelRepository) FindByProviderID(providerID uuid.UUID) ([]models.ProviderModel, error) {
	var models []models.ProviderModel
	err := database.DB.Where("provider_id = ?", providerID).
		Order("is_default DESC, created_at ASC").
		Find(&models).Error
	return models, err
}

func (r *ProviderModelRepository) FindByID(id uuid.UUID) (*models.ProviderModel, error) {
	var model models.ProviderModel
	err := database.DB.Where("id = ?", id).First(&model).Error
	if err != nil {
		return nil, err
	}
	return &model, nil
}

func (r *ProviderModelRepository) FindByIDAndProviderID(id, providerID uuid.UUID) (*models.ProviderModel, error) {
	var model models.ProviderModel
	err := database.DB.Where("id = ? AND provider_id = ?", id, providerID).First(&model).Error
	if err != nil {
		return nil, err
	}
	return &model, nil
}

func (r *ProviderModelRepository) Update(model *models.ProviderModel) error {
	return database.DB.Save(model).Error
}

func (r *ProviderModelRepository) Delete(id, providerID uuid.UUID) error {
	return database.DB.Where("id = ? AND provider_id = ?", id, providerID).Delete(&models.ProviderModel{}).Error
}

func (r *ProviderModelRepository) BatchCreate(models []models.ProviderModel) error {
	return database.DB.Create(&models).Error
}

func (r *ProviderModelRepository) SetDefault(providerID, modelID uuid.UUID) error {
	// Unset all defaults for this provider
	if err := database.DB.Model(&models.ProviderModel{}).
		Where("provider_id = ?", providerID).
		Update("is_default", false).Error; err != nil {
		return err
	}
	// Set the specified model as default
	return database.DB.Model(&models.ProviderModel{}).
		Where("id = ? AND provider_id = ?", modelID, providerID).
		Update("is_default", true).Error
}
