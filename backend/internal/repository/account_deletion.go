package repository

import (
	"github.com/chat-note/backend/internal/database"
	"github.com/chat-note/backend/internal/models"

	"gorm.io/gorm"
)

type AccountDeletionRepository struct {
	userRepo *UserRepository
}

func NewAccountDeletionRepository() *AccountDeletionRepository {
	return &AccountDeletionRepository{
		userRepo: NewUserRepository(),
	}
}

func (r *AccountDeletionRepository) DeleteAllUserData(userID uint) error {
	return database.DB.Transaction(func(tx *gorm.DB) error {
		if err := r.deleteConversationSummaries(tx, userID); err != nil {
			return err
		}
		if err := r.deleteMessageRequests(tx, userID); err != nil {
			return err
		}
		if err := r.deleteConversations(tx, userID); err != nil {
			return err
		}
		if err := r.deleteNoteTags(tx, userID); err != nil {
			return err
		}
		if err := r.deleteNotes(tx, userID); err != nil {
			return err
		}
		if err := r.deleteFolders(tx, userID); err != nil {
			return err
		}
		if err := r.deleteProviderModels(tx, userID); err != nil {
			return err
		}
		if err := r.deleteProviders(tx, userID); err != nil {
			return err
		}
		if err := r.deleteRefreshTokens(tx, userID); err != nil {
			return err
		}
		if err := r.deleteOAuthAccounts(tx, userID); err != nil {
			return err
		}
		if err := r.deleteUserSettings(tx, userID); err != nil {
			return err
		}
		if err := r.deleteFeedbacks(tx, userID); err != nil {
			return err
		}
		if err := r.deleteSatisfactionRatings(tx, userID); err != nil {
			return err
		}
		if err := r.deleteFeatureVotes(tx, userID); err != nil {
			return err
		}
		if err := r.userRepo.DeleteUser(tx, userID); err != nil {
			return err
		}
		return nil
	})
}

func (r *AccountDeletionRepository) deleteConversationSummaries(tx *gorm.DB, userID uint) error {
	return tx.Where("conversation_id IN (SELECT id FROM conversations WHERE user_id = ?)", userID).Delete(&models.ConversationSummary{}).Error
}

func (r *AccountDeletionRepository) deleteMessageRequests(tx *gorm.DB, userID uint) error {
	return tx.Where("conversation_id IN (SELECT id FROM conversations WHERE user_id = ?)", userID).Delete(&models.MessageRequest{}).Error
}

func (r *AccountDeletionRepository) deleteConversations(tx *gorm.DB, userID uint) error {
	return tx.Where("user_id = ?", userID).Delete(&models.Conversation{}).Error
}

func (r *AccountDeletionRepository) deleteNoteTags(tx *gorm.DB, userID uint) error {
	return tx.Where("note_id IN (SELECT id FROM notes WHERE user_id = ?)", userID).Delete(&models.NoteTag{}).Error
}

func (r *AccountDeletionRepository) deleteNotes(tx *gorm.DB, userID uint) error {
	return tx.Where("user_id = ?", userID).Delete(&models.Note{}).Error
}

func (r *AccountDeletionRepository) deleteFolders(tx *gorm.DB, userID uint) error {
	return tx.Where("user_id = ?", userID).Delete(&models.Folder{}).Error
}

func (r *AccountDeletionRepository) deleteProviderModels(tx *gorm.DB, userID uint) error {
	return tx.Where("provider_id IN (SELECT id FROM providers WHERE user_id = ?)", userID).Delete(&models.ProviderModel{}).Error
}

func (r *AccountDeletionRepository) deleteProviders(tx *gorm.DB, userID uint) error {
	return tx.Where("user_id = ?", userID).Delete(&models.Provider{}).Error
}

func (r *AccountDeletionRepository) deleteRefreshTokens(tx *gorm.DB, userID uint) error {
	return tx.Where("user_id = ?", userID).Delete(&models.RefreshToken{}).Error
}

func (r *AccountDeletionRepository) deleteOAuthAccounts(tx *gorm.DB, userID uint) error {
	return tx.Where("user_id = ?", userID).Delete(&models.OAuthAccount{}).Error
}

func (r *AccountDeletionRepository) deleteUserSettings(tx *gorm.DB, userID uint) error {
	return tx.Where("user_id = ?", userID).Delete(&models.UserSettings{}).Error
}

func (r *AccountDeletionRepository) deleteFeedbacks(tx *gorm.DB, userID uint) error {
	return tx.Where("user_id = ?", userID).Delete(&models.Feedback{}).Error
}

func (r *AccountDeletionRepository) deleteSatisfactionRatings(tx *gorm.DB, userID uint) error {
	return tx.Where("user_id = ?", userID).Delete(&models.SatisfactionRating{}).Error
}

func (r *AccountDeletionRepository) deleteFeatureVotes(tx *gorm.DB, userID uint) error {
	return tx.Where("user_id = ?", userID).Delete(&models.FeatureVote{}).Error
}
