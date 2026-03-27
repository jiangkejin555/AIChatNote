package repository

import (
	"github.com/chat-note/backend/internal/database"
	"github.com/chat-note/backend/internal/models"
)

type OAuthAccountRepository struct{}

func NewOAuthAccountRepository() *OAuthAccountRepository {
	return &OAuthAccountRepository{}
}

func (r *OAuthAccountRepository) Create(account *models.OAuthAccount) error {
	return database.DB.Create(account).Error
}

func (r *OAuthAccountRepository) FindByProviderAndUserID(provider string, providerUserID string) (*models.OAuthAccount, error) {
	var account models.OAuthAccount
	err := database.DB.Where("provider = ? AND provider_user_id = ?", provider, providerUserID).First(&account).Error
	if err != nil {
		return nil, err
	}
	return &account, nil
}

func (r *OAuthAccountRepository) FindByUserID(userID uint) ([]models.OAuthAccount, error) {
	var accounts []models.OAuthAccount
	err := database.DB.Where("user_id = ?", userID).Find(&accounts).Error
	if err != nil {
		return nil, err
	}
	return accounts, nil
}

func (r *OAuthAccountRepository) FindByProviderAndLocalUserID(provider string, userID uint) (*models.OAuthAccount, error) {
	var account models.OAuthAccount
	err := database.DB.Where("provider = ? AND user_id = ?", provider, userID).First(&account).Error
	if err != nil {
		return nil, err
	}
	return &account, nil
}

func (r *OAuthAccountRepository) Delete(id uint) error {
	return database.DB.Delete(&models.OAuthAccount{}, id).Error
}

func (r *OAuthAccountRepository) DeleteByProviderAndUserID(provider string, providerUserID string) error {
	return database.DB.Where("provider = ? AND provider_user_id = ?", provider, providerUserID).Delete(&models.OAuthAccount{}).Error
}
