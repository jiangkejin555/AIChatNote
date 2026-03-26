package repository

import (
	"testing"

	"github.com/chat-note/backend/internal/models"
	"github.com/chat-note/backend/internal/testutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSummaryRepository(t *testing.T) {
	cleanup := testutil.SetupTestDB(t)
	defer cleanup()

	repo := NewSummaryRepository()

	t.Run("Create summary", func(t *testing.T) {
		summary := &models.ConversationSummary{
			ConversationID: 1,
			Summary:        "Test summary",
			EndMessageID:   10,
		}

		err := repo.Create(summary)
		require.NoError(t, err)

		found, err := repo.FindByConversationID(1)
		require.NoError(t, err)
		assert.Equal(t, found.Summary, "Test summary")
		assert.Equal(t, found.EndMessageID, uint(10))
	})

	t.Run("Upsert creates new summary", func(t *testing.T) {
		summary := &models.ConversationSummary{
			ConversationID: 2,
			Summary:        "New summary",
			EndMessageID:   10,
		}

		err := repo.Upsert(summary)
		require.NoError(t, err)

		found, err := repo.FindByConversationID(2)
		require.NoError(t, err)
		assert.Equal(t, found.Summary, "New summary")
	})

	t.Run("Upsert updates existing summary", func(t *testing.T) {
		// Create initial
		summary := &models.ConversationSummary{
			ConversationID: 3,
			Summary:        "Initial summary",
			EndMessageID:   10,
		}
		err := repo.Create(summary)
		require.NoError(t, err)

		// Update via Upsert
		updated := &models.ConversationSummary{
			ConversationID: 3,
			Summary:        "Updated summary",
			EndMessageID:   20,
		}
		err = repo.Upsert(updated)
		require.NoError(t, err)

		found, err := repo.FindByConversationID(3)
		require.NoError(t, err)
		assert.Equal(t, found.Summary, "Updated summary")
		assert.Equal(t, found.EndMessageID, uint(20))
	})

	t.Run("FindByConversationID returns ErrSummaryNotFound for nonexistent summary", func(t *testing.T) {
		_, err := repo.FindByConversationID(999)
		require.Error(t, err)
		assert.Equal(t, ErrSummaryNotFound, err)
	})
}
