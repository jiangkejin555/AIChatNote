package repository

import (
	"github.com/chat-note/backend/internal/database"
	"github.com/chat-note/backend/internal/models"
)

type FeatureRequestRepository struct{}

func NewFeatureRequestRepository() *FeatureRequestRepository {
	return &FeatureRequestRepository{}
}

func (r *FeatureRequestRepository) FindAll() ([]models.FeatureRequest, error) {
	var features []models.FeatureRequest
	err := database.DB.Order("created_at DESC").Find(&features).Error
	return features, err
}

func (r *FeatureRequestRepository) FindByID(id uint) (*models.FeatureRequest, error) {
	var feature models.FeatureRequest
	err := database.DB.First(&feature, id).Error
	if err != nil {
		return nil, err
	}
	return &feature, nil
}

func (r *FeatureRequestRepository) GetVoteCount(featureID uint) (int64, error) {
	var count int64
	err := database.DB.Model(&models.FeatureVote{}).Where("feature_id = ?", featureID).Count(&count).Error
	return count, err
}

func (r *FeatureRequestRepository) HasUserVoted(userID, featureID uint) (bool, error) {
	var count int64
	err := database.DB.Model(&models.FeatureVote{}).Where("user_id = ? AND feature_id = ?", userID, featureID).Count(&count).Error
	return count > 0, err
}

func (r *FeatureRequestRepository) CreateVote(vote *models.FeatureVote) error {
	return database.DB.Create(vote).Error
}

func (r *FeatureRequestRepository) DeleteVote(userID, featureID uint) error {
	return database.DB.Where("user_id = ? AND feature_id = ?", userID, featureID).Delete(&models.FeatureVote{}).Error
}
