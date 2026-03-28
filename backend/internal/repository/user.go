package repository

import (
	"github.com/chat-note/backend/internal/database"
	"github.com/chat-note/backend/internal/models"

	"gorm.io/gorm"
)

type UserRepository struct{}

func NewUserRepository() *UserRepository {
	return &UserRepository{}
}

func (r *UserRepository) Create(user *models.User) error {
	return database.DB.Create(user).Error
}

func (r *UserRepository) FindByEmail(email string) (*models.User, error) {
	var user models.User
	err := database.DB.Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) FindByID(id uint) (*models.User, error) {
	var user models.User
	err := database.DB.First(&user, id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) DeleteUser(tx *gorm.DB, userID uint) error {
	if tx == nil {
		tx = database.DB
	}
	return tx.Delete(&models.User{}, userID).Error
}

func (r *UserRepository) UpdatePassword(id uint, passwordHash string) error {
	return database.DB.Model(&models.User{}).Where("id = ?", id).Update("password_hash", passwordHash).Error
}

// Count returns the total number of users
func (r *UserRepository) Count() (int64, error) {
	var count int64
	err := database.DB.Model(&models.User{}).Count(&count).Error
	return count, err
}
