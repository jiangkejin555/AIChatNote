package repository

import (
	"testing"

	"github.com/ai-chat-notes/backend/internal/models"
	"github.com/ai-chat-notes/backend/internal/testutil"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNoteRepository(t *testing.T) {
	cleanup := testutil.SetupTestDB(t)
	defer cleanup()

	noteRepo := NewNoteRepository()
	folderRepo := NewFolderRepository()
	userRepo := NewUserRepository()

	user := &models.User{
		Email:        "note_test@example.com",
		PasswordHash: "hash",
	}
	require.NoError(t, userRepo.Create(user))

	folder := &models.Folder{
		UserID: user.ID,
		Name:   "Test Folder",
	}
	require.NoError(t, folderRepo.Create(folder))

	t.Run("Create", func(t *testing.T) {
		note := &models.Note{
			UserID:   user.ID,
			Title:    "Test Note",
			Content:  "This is test content",
			FolderID: &folder.ID,
		}

		err := noteRepo.Create(note)

		require.NoError(t, err)
		assert.Greater(t, note.ID, uint(0))
	})

	t.Run("FindByUserID", func(t *testing.T) {
		// Create notes
		for i := 0; i < 3; i++ {
			note := &models.Note{
				UserID:  user.ID,
				Title:   "Note",
				Content: "Content",
			}
			require.NoError(t, noteRepo.Create(note))
		}

		notes, err := noteRepo.FindByUserID(user.ID, nil)

		require.NoError(t, err)
		assert.GreaterOrEqual(t, len(notes), 3)
	})

	t.Run("FindByUserID_WithFolderFilter", func(t *testing.T) {
		folder2 := &models.Folder{
			UserID: user.ID,
			Name:   "Filter Folder",
		}
		require.NoError(t, folderRepo.Create(folder2))

		noteInFolder := &models.Note{
			UserID:   user.ID,
			Title:    "Note in Folder",
			Content:  "Content",
			FolderID: &folder2.ID,
		}
		require.NoError(t, noteRepo.Create(noteInFolder))

		notes, err := noteRepo.FindByUserID(user.ID, map[string]interface{}{"folder_id": folder2.ID})

		require.NoError(t, err)
		for _, n := range notes {
			assert.NotNil(t, n.FolderID)
			if n.FolderID != nil {
				assert.Equal(t, folder2.ID, *n.FolderID)
			}
		}
	})

	t.Run("FindByID", func(t *testing.T) {
		note := &models.Note{
			UserID:  user.ID,
			Title:   "Find By ID",
			Content: "Content",
		}
		require.NoError(t, noteRepo.Create(note))

		found, err := noteRepo.FindByID(note.ID)

		require.NoError(t, err)
		require.NotNil(t, found)
		assert.Equal(t, note.ID, found.ID)
	})

	t.Run("FindByIDAndUserID", func(t *testing.T) {
		note := &models.Note{
			UserID:  user.ID,
			Title:   "Owner Test",
			Content: "Content",
		}
		require.NoError(t, noteRepo.Create(note))

		// Find with correct user
		found, err := noteRepo.FindByIDAndUserID(note.ID, user.ID)
		require.NoError(t, err)
		assert.NotNil(t, found)

		// Find with wrong user
		found, err = noteRepo.FindByIDAndUserID(note.ID, 999999)
		assert.Error(t, err)
		assert.Nil(t, found)
	})

	t.Run("Update", func(t *testing.T) {
		note := &models.Note{
			UserID:  user.ID,
			Title:   "Original Title",
			Content: "Original Content",
		}
		require.NoError(t, noteRepo.Create(note))

		note.Title = "Updated Title"
		note.Content = "Updated Content"
		err := noteRepo.Update(note)

		require.NoError(t, err)

		found, _ := noteRepo.FindByID(note.ID)
		assert.Equal(t, "Updated Title", found.Title)
		assert.Equal(t, "Updated Content", found.Content)
	})

	t.Run("Delete", func(t *testing.T) {
		note := &models.Note{
			UserID:  user.ID,
			Title:   "To Delete",
			Content: "Content",
		}
		require.NoError(t, noteRepo.Create(note))

		err := noteRepo.Delete(note.ID, user.ID)

		require.NoError(t, err)

		found, err := noteRepo.FindByID(note.ID)
		assert.Error(t, err)
		assert.Nil(t, found)
	})

	t.Run("BatchDelete", func(t *testing.T) {
		var ids []uint
		for i := 0; i < 3; i++ {
			note := &models.Note{
				UserID:  user.ID,
				Title:   "Batch Delete",
				Content: "Content",
			}
			require.NoError(t, noteRepo.Create(note))
			ids = append(ids, note.ID)
		}

		err := noteRepo.BatchDelete(ids, user.ID)

		require.NoError(t, err)

		for _, id := range ids {
			found, err := noteRepo.FindByID(id)
			assert.Error(t, err)
			assert.Nil(t, found)
		}
	})

	t.Run("BatchMove", func(t *testing.T) {
		targetFolder := &models.Folder{
			UserID: user.ID,
			Name:   "Target Folder",
		}
		require.NoError(t, folderRepo.Create(targetFolder))

		var ids []uint
		for i := 0; i < 2; i++ {
			note := &models.Note{
				UserID:  user.ID,
				Title:   "Batch Move",
				Content: "Content",
			}
			require.NoError(t, noteRepo.Create(note))
			ids = append(ids, note.ID)
		}

		err := noteRepo.BatchMove(ids, user.ID, &targetFolder.ID)

		require.NoError(t, err)

		for _, id := range ids {
			found, err := noteRepo.FindByID(id)
			require.NoError(t, err)
			assert.NotNil(t, found.FolderID)
			assert.Equal(t, targetFolder.ID, *found.FolderID)
		}
	})

	t.Run("Tags", func(t *testing.T) {
		note := &models.Note{
			UserID:  user.ID,
			Title:   "Tag Test",
			Content: "Content",
		}
		require.NoError(t, noteRepo.Create(note))

		// Create tags
		tags := []models.NoteTag{
			{NoteID: note.ID, Tag: "tag1"},
			{NoteID: note.ID, Tag: "tag2"},
		}
		err := noteRepo.CreateTags(tags)
		require.NoError(t, err)

		// Verify tags exist
		found, _ := noteRepo.FindByID(note.ID)
		assert.Len(t, found.Tags, 2)

		// Delete tags
		err = noteRepo.DeleteTags(note.ID)
		require.NoError(t, err)

		found, _ = noteRepo.FindByID(note.ID)
		assert.Len(t, found.Tags, 0)
	})
}

func TestFolderRepository(t *testing.T) {
	cleanup := testutil.SetupTestDB(t)
	defer cleanup()

	folderRepo := NewFolderRepository()
	userRepo := NewUserRepository()

	user := &models.User{
		Email:        "folder_test@example.com",
		PasswordHash: "hash",
	}
	require.NoError(t, userRepo.Create(user))

	t.Run("Create", func(t *testing.T) {
		folder := &models.Folder{
			UserID: user.ID,
			Name:   "Test Folder",
		}

		err := folderRepo.Create(folder)

		require.NoError(t, err)
		assert.Greater(t, folder.ID, uint(0))
	})

	t.Run("Create_Nested", func(t *testing.T) {
		parent := &models.Folder{
			UserID: user.ID,
			Name:   "Parent",
		}
		require.NoError(t, folderRepo.Create(parent))

		child := &models.Folder{
			UserID:   user.ID,
			Name:     "Child",
			ParentID: &parent.ID,
		}
		err := folderRepo.Create(child)

		require.NoError(t, err)
		assert.Equal(t, parent.ID, *child.ParentID)
	})

	t.Run("FindByUserID", func(t *testing.T) {
		folders, err := folderRepo.FindByUserID(user.ID)

		require.NoError(t, err)
		assert.GreaterOrEqual(t, len(folders), 1)
	})

	t.Run("FindByIDAndUserID", func(t *testing.T) {
		folder := &models.Folder{
			UserID: user.ID,
			Name:   "Find Test",
		}
		require.NoError(t, folderRepo.Create(folder))

		found, err := folderRepo.FindByIDAndUserID(folder.ID, user.ID)

		require.NoError(t, err)
		require.NotNil(t, found)
		assert.Equal(t, folder.ID, found.ID)
	})

	t.Run("Update", func(t *testing.T) {
		folder := &models.Folder{
			UserID: user.ID,
			Name:   "Original",
		}
		require.NoError(t, folderRepo.Create(folder))

		folder.Name = "Updated"
		err := folderRepo.Update(folder)

		require.NoError(t, err)

		found, _ := folderRepo.FindByIDAndUserID(folder.ID, user.ID)
		assert.Equal(t, "Updated", found.Name)
	})

	t.Run("Delete", func(t *testing.T) {
		folder := &models.Folder{
			UserID: user.ID,
			Name:   "To Delete",
		}
		require.NoError(t, folderRepo.Create(folder))

		err := folderRepo.Delete(folder.ID, user.ID)

		require.NoError(t, err)

		found, err := folderRepo.FindByIDAndUserID(folder.ID, user.ID)
		assert.Error(t, err)
		assert.Nil(t, found)
	})
}

func TestTagRepository(t *testing.T) {
	cleanup := testutil.SetupTestDB(t)
	defer cleanup()

	tagRepo := NewTagRepository()
	noteRepo := NewNoteRepository()
	userRepo := NewUserRepository()

	user := &models.User{
		Email:        "tag_test@example.com",
		PasswordHash: "hash",
	}
	require.NoError(t, userRepo.Create(user))

	t.Run("FindByUserID", func(t *testing.T) {
		// Create note with tags
		note := &models.Note{
			UserID:  user.ID,
			Title:   "Tagged Note",
			Content: "Content",
		}
		require.NoError(t, noteRepo.Create(note))

		tags := []models.NoteTag{
			{NoteID: note.ID, Tag: "work"},
			{NoteID: note.ID, Tag: "important"},
		}
		require.NoError(t, noteRepo.CreateTags(tags))

		foundTags, err := tagRepo.FindByUserID(user.ID)

		require.NoError(t, err)
		assert.GreaterOrEqual(t, len(foundTags), 1)
	})

	t.Run("FindByNoteID", func(t *testing.T) {
		note := &models.Note{
			UserID:  user.ID,
			Title:   "Find Tags",
			Content: "Content",
		}
		require.NoError(t, noteRepo.Create(note))

		tags := []models.NoteTag{
			{NoteID: note.ID, Tag: "tag1"},
			{NoteID: note.ID, Tag: "tag2"},
		}
		require.NoError(t, noteRepo.CreateTags(tags))

		foundTags, err := tagRepo.FindByNoteID(note.ID)

		require.NoError(t, err)
		assert.Len(t, foundTags, 2)
	})
}
