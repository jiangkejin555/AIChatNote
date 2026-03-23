package repository

import (
	"crypto/sha256"
	"encoding/hex"

	"github.com/ai-chat-notes/backend/internal/database"
	"github.com/ai-chat-notes/backend/internal/models"
)

type RefreshTokenRepository struct{}

func NewRefreshTokenRepository() *RefreshTokenRepository {
	return &RefreshTokenRepository{}
}

func (r *RefreshTokenRepository) Create(token *models.RefreshToken) error {
	token.TokenHash = hashToken(token.TokenHash)
	return database.DB.Create(token).Error
}

func (r *RefreshTokenRepository) FindByToken(token string) (*models.RefreshToken, error) {
	tokenHash := hashToken(token)
	var rt models.RefreshToken
	err := database.DB.Where("token_hash = ? AND expires_at > NOW()", tokenHash).First(&rt).Error
	if err != nil {
		return nil, err
	}
	return &rt, nil
}

func (r *RefreshTokenRepository) DeleteByToken(token string) error {
	tokenHash := hashToken(token)
	return database.DB.Where("token_hash = ?", tokenHash).Delete(&models.RefreshToken{}).Error
}

func (r *RefreshTokenRepository) DeleteByUserID(userID uint) error {
	return database.DB.Where("user_id = ?", userID).Delete(&models.RefreshToken{}).Error
}

func hashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}
