package repository

import (
	"github.com/chat-note/backend/internal/database"
	"github.com/chat-note/backend/internal/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
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

// SyncResult represents the result of a sync operation
type SyncResult struct {
	Models   []models.ProviderModel `json:"models"`
	Added    int                    `json:"added"`
	Deleted  int                    `json:"deleted"`
	Updated  int                    `json:"updated"`
	Enabled  int                    `json:"enabled"`
	Disabled int                    `json:"disabled"`
}

// Sync performs add, delete, enable, disable, and update default operations in a single transaction
// newDefaultModelIndex: index of the newly added model to set as default (-1 if none)
// enableIDs: model IDs to enable
// disableIDs: model IDs to disable
func (r *ProviderModelRepository) Sync(
	providerID uuid.UUID,
	modelsToAdd []models.ProviderModel,
	deleteIDs []uuid.UUID,
	defaultModelID uuid.UUID,
	newDefaultModelIndex int,
	enableIDs []uuid.UUID,
	disableIDs []uuid.UUID,
) (*SyncResult, error) {
	result := &SyncResult{}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		// 1. Hard delete models with associated conversation handling
		// Before deleting, set provider_model_id to NULL for all associated conversations
		if len(deleteIDs) > 0 {
			// Update associated conversations: set provider_model_id to NULL
			if err := tx.Model(&models.Conversation{}).
				Where("provider_model_id IN ?", deleteIDs).
				Update("provider_model_id", nil).Error; err != nil {
				return err
			}
			// Hard delete the models
			if err := tx.Where("id IN ? AND provider_id = ?", deleteIDs, providerID).
				Delete(&models.ProviderModel{}).Error; err != nil {
				return err
			}
			result.Deleted = len(deleteIDs)
		}

		// 2. Enable models
		if len(enableIDs) > 0 {
			if err := tx.Model(&models.ProviderModel{}).
				Where("id IN ? AND provider_id = ?", enableIDs, providerID).
				Update("enabled", true).Error; err != nil {
				return err
			}
			result.Enabled = len(enableIDs)
		}

		// 3. Disable models
		if len(disableIDs) > 0 {
			if err := tx.Model(&models.ProviderModel{}).
				Where("id IN ? AND provider_id = ?", disableIDs, providerID).
				Update("enabled", false).Error; err != nil {
				return err
			}
			result.Disabled = len(disableIDs)
		}

		// 4. Add new models
		if len(modelsToAdd) > 0 {
			if err := tx.Create(&modelsToAdd).Error; err != nil {
				return err
			}
			result.Added = len(modelsToAdd)
		}

		// 5. Update default model if specified
		// Priority: newDefaultModelIndex > defaultModelID
		effectiveDefaultID := defaultModelID
		if newDefaultModelIndex >= 0 && newDefaultModelIndex < len(modelsToAdd) {
			// After Create, modelsToAdd[newDefaultModelIndex].ID is populated
			effectiveDefaultID = modelsToAdd[newDefaultModelIndex].ID
		}

		if effectiveDefaultID != uuid.Nil {
			// Unset all defaults for this provider
			if err := tx.Model(&models.ProviderModel{}).
				Where("provider_id = ?", providerID).
				Update("is_default", false).Error; err != nil {
				return err
			}
			// Set the specified model as default
			if err := tx.Model(&models.ProviderModel{}).
				Where("id = ? AND provider_id = ?", effectiveDefaultID, providerID).
				Update("is_default", true).Error; err != nil {
				return err
			}
			result.Updated = 1
		}

		// 6. Fetch final list of models
		var finalModels []models.ProviderModel
		if err := tx.Where("provider_id = ?", providerID).
			Order("is_default DESC, created_at ASC").
			Find(&finalModels).Error; err != nil {
			return err
		}
		result.Models = finalModels

		return nil
	})

	if err != nil {
		return nil, err
	}

	return result, nil
}
