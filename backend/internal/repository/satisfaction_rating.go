package repository

import (
	"github.com/chat-note/backend/internal/database"
	"github.com/chat-note/backend/internal/models"
	"gorm.io/gorm/clause"
)

type SatisfactionRatingRepository struct{}

func NewSatisfactionRatingRepository() *SatisfactionRatingRepository {
	return &SatisfactionRatingRepository{}
}

func (r *SatisfactionRatingRepository) CreateOrUpdate(rating *models.SatisfactionRating) error {
	return database.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"rating", "comment", "updated_at"}),
	}).Create(rating).Error
}

func (r *SatisfactionRatingRepository) FindByUserID(userID uint) (*models.SatisfactionRating, error) {
	var rating models.SatisfactionRating
	err := database.DB.Where("user_id = ?", userID).First(&rating).Error
	if err != nil {
		return nil, err
	}
	return &rating, nil
}
