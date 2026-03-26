package repository

import (
	"github.com/chat-note/backend/internal/database"
	"github.com/chat-note/backend/internal/models"
)

type VersionRepository struct{}

func NewVersionRepository() *VersionRepository {
	return &VersionRepository{}
}

func (r *VersionRepository) FindAll() ([]models.Version, error) {
	var versions []models.Version
	err := database.DB.Order("release_date DESC").Find(&versions).Error
	return versions, err
}

func (r *VersionRepository) FindLatest() (*models.Version, error) {
	var version models.Version
	err := database.DB.Order("release_date DESC").First(&version).Error
	if err != nil {
		return nil, err
	}
	return &version, nil
}
