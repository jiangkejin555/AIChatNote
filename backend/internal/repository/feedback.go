package repository

import (
	"github.com/chat-note/backend/internal/database"
	"github.com/chat-note/backend/internal/models"
)

type FeedbackRepository struct{}

func NewFeedbackRepository() *FeedbackRepository {
	return &FeedbackRepository{}
}

func (r *FeedbackRepository) Create(feedback *models.Feedback) error {
	return database.DB.Create(feedback).Error
}

func (r *FeedbackRepository) FindByID(id uint) (*models.Feedback, error) {
	var feedback models.Feedback
	err := database.DB.First(&feedback, id).Error
	if err != nil {
		return nil, err
	}
	return &feedback, nil
}

func (r *FeedbackRepository) FindByUserID(userID uint, page, pageSize int) ([]models.Feedback, int64, error) {
	var feedbacks []models.Feedback
	var total int64

	db := database.DB.Model(&models.Feedback{}).Where("user_id = ?", userID)
	db.Count(&total)

	offset := (page - 1) * pageSize
	err := db.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&feedbacks).Error
	return feedbacks, total, err
}

func (r *FeedbackRepository) Update(feedback *models.Feedback) error {
	return database.DB.Save(feedback).Error
}
