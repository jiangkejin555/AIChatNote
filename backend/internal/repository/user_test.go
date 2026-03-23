package repository

import (
	"testing"

	"github.com/chat-note/backend/internal/models"
	"github.com/chat-note/backend/internal/testutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestUserRepository(t *testing.T) {
	cleanup := testutil.SetupTestDB(t)
	defer cleanup()

	repo := NewUserRepository()

	t.Run("Create", func(t *testing.T) {
		user := &models.User{
			Email:        "create@example.com",
			PasswordHash: "hash123",
		}

		err := repo.Create(user)

		require.NoError(t, err)
		assert.Greater(t, user.ID, uint(0), "user ID should be populated")
		assert.NotZero(t, user.CreatedAt)
	})

	t.Run("Create_DuplicateEmail", func(t *testing.T) {
		user1 := &models.User{
			Email:        "duplicate@example.com",
			PasswordHash: "hash1",
		}
		err := repo.Create(user1)
		require.NoError(t, err)

		user2 := &models.User{
			Email:        "duplicate@example.com",
			PasswordHash: "hash2",
		}
		err = repo.Create(user2)
		assert.Error(t, err, "duplicate email should fail")
	})

	t.Run("FindByEmail_Exists", func(t *testing.T) {
		user := &models.User{
			Email:        "findbyemail@example.com",
			PasswordHash: "hash",
		}
		err := repo.Create(user)
		require.NoError(t, err)

		found, err := repo.FindByEmail("findbyemail@example.com")

		require.NoError(t, err)
		require.NotNil(t, found)
		assert.Equal(t, "findbyemail@example.com", found.Email)
		assert.Equal(t, user.ID, found.ID)
	})

	t.Run("FindByEmail_NotExists", func(t *testing.T) {
		found, err := repo.FindByEmail("nonexistent@example.com")

		assert.Error(t, err)
		assert.Nil(t, found)
	})

	t.Run("FindByID_Exists", func(t *testing.T) {
		user := &models.User{
			Email:        "findbyid@example.com",
			PasswordHash: "hash",
		}
		err := repo.Create(user)
		require.NoError(t, err)

		found, err := repo.FindByID(user.ID)

		require.NoError(t, err)
		require.NotNil(t, found)
		assert.Equal(t, user.ID, found.ID)
		assert.Equal(t, "findbyid@example.com", found.Email)
	})

	t.Run("FindByID_NotExists", func(t *testing.T) {
		found, err := repo.FindByID(999999)

		assert.Error(t, err)
		assert.Nil(t, found)
	})
}

func TestUserRepository_Integration(t *testing.T) {
	cleanup := testutil.SetupTestDB(t)
	defer cleanup()

	repo := NewUserRepository()

	t.Run("full user lifecycle", func(t *testing.T) {
		// Create
		user := &models.User{
			Email:        "lifecycle@example.com",
			PasswordHash: "initialhash",
		}
		err := repo.Create(user)
		require.NoError(t, err)

		// Find by Email
		found, err := repo.FindByEmail("lifecycle@example.com")
		require.NoError(t, err)
		assert.Equal(t, user.ID, found.ID)

		// Find by ID
		found, err = repo.FindByID(user.ID)
		require.NoError(t, err)
		assert.Equal(t, "lifecycle@example.com", found.Email)
	})
}
