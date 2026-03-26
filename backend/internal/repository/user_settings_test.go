package repository

import (
	"testing"

	"github.com/chat-note/backend/internal/models"
	"github.com/chat-note/backend/internal/testutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestUserSettingsRepository(t *testing.T) {
	cleanup := testutil.SetupTestDB(t)
	defer cleanup()

	repo := NewUserSettingsRepository()

	t.Run("GetOrCreate creates new settings with defaults", func(t *testing.T) {
		userID := uint(1)
		settings, err := repo.GetOrCreate(userID, models.ContextModeSimple, models.MemoryLevelNormal)
		require.NoError(t, err)
		assert.Equal(t, userID, settings.UserID)
		assert.Equal(t, models.ContextModeSimple, settings.ContextMode)
		assert.Equal(t, models.MemoryLevelNormal, settings.MemoryLevel)
	})

	t.Run("GetOrCreate returns existing settings", func(t *testing.T) {
		userID := uint(2)
		// First call creates
		settings1, err := repo.GetOrCreate(userID, models.ContextModeSimple, models.MemoryLevelNormal)
		require.NoError(t, err)

		// Second call returns existing
		settings2, err := repo.GetOrCreate(userID, models.ContextModeSummary, models.MemoryLevelLong)
		require.NoError(t, err)

		// Should return original settings, not new defaults
		assert.Equal(t, settings1.ID, settings2.ID)
		assert.Equal(t, models.ContextModeSimple, settings2.ContextMode)
		assert.Equal(t, models.MemoryLevelNormal, settings2.MemoryLevel)
	})

	t.Run("FindByUserID returns ErrUserSettingsNotFound for nonexistent user", func(t *testing.T) {
		_, err := repo.FindByUserID(999)
		require.Error(t, err)
		assert.Equal(t, ErrUserSettingsNotFound, err)
	})

	t.Run("Upsert creates new settings", func(t *testing.T) {
		userID := uint(3)
		settings := &models.UserSettings{
			UserID:      userID,
			ContextMode: models.ContextModeSummary,
			MemoryLevel: models.MemoryLevelLong,
		}

		err := repo.Upsert(settings)
		require.NoError(t, err)

		found, err := repo.FindByUserID(userID)
		require.NoError(t, err)
		assert.Equal(t, models.ContextModeSummary, found.ContextMode)
		assert.Equal(t, models.MemoryLevelLong, found.MemoryLevel)
	})

	t.Run("Upsert updates existing settings", func(t *testing.T) {
		userID := uint(4)
		// Create initial
		settings := &models.UserSettings{
			UserID:      userID,
			ContextMode: models.ContextModeSimple,
			MemoryLevel: models.MemoryLevelShort,
		}
		err := repo.Upsert(settings)
		require.NoError(t, err)

		// Update via Upsert
		updated := &models.UserSettings{
			UserID:      userID,
			ContextMode: models.ContextModeSummary,
			MemoryLevel: models.MemoryLevelLong,
		}
		err = repo.Upsert(updated)
		require.NoError(t, err)

		found, err := repo.FindByUserID(userID)
		require.NoError(t, err)
		assert.Equal(t, models.ContextModeSummary, found.ContextMode)
		assert.Equal(t, models.MemoryLevelLong, found.MemoryLevel)
	})

	t.Run("Update changes settings", func(t *testing.T) {
		userID := uint(5)
		// Create initial
		settings, err := repo.GetOrCreate(userID, models.ContextModeSimple, models.MemoryLevelNormal)
		require.NoError(t, err)

		// Update fields
		settings.ContextMode = models.ContextModeSummary
		settings.MemoryLevel = models.MemoryLevelLong
		err = repo.Upsert(settings)
		require.NoError(t, err)

		// Verify update
		found, err := repo.FindByUserID(userID)
		require.NoError(t, err)
		assert.Equal(t, models.ContextModeSummary, found.ContextMode)
		assert.Equal(t, models.MemoryLevelLong, found.MemoryLevel)
	})
}
