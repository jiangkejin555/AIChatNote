package repository

import (
	"testing"

	"github.com/chat-note/backend/internal/database"
	"github.com/chat-note/backend/internal/models"
	"github.com/chat-note/backend/internal/testutil"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestProviderRepository tests Provider CRUD operations
// Note: We need to manually set UUID for Provider since SQLite doesn't support gen_random_uuid()
func TestProviderRepository(t *testing.T) {
	cleanup := testutil.SetupTestDB(t)
	defer cleanup()

	providerRepo := NewProviderRepository()
	userRepo := NewUserRepository()

	user := &models.User{
		Email:        "provider_test@example.com",
		PasswordHash: "hash",
	}
	require.NoError(t, userRepo.Create(user))

	t.Run("Create", func(t *testing.T) {
		provider := &models.Provider{
			ID:              uuid.New(),
			UserID:          user.ID,
			Name:            "Test Provider",
			Type:            models.ProviderCustom,
			APIBase:         "https://api.example.com",
			APIKeyEncrypted: "enc:test-key",
		}

		err := providerRepo.Create(provider)

		require.NoError(t, err)
		assert.NotEqual(t, uuid.Nil, provider.ID)
	})

	t.Run("FindByUserID", func(t *testing.T) {
		// Create providers
		for i := 0; i < 2; i++ {
			provider := &models.Provider{
				ID:              uuid.New(),
				UserID:          user.ID,
				Name:            "Provider",
				Type:            models.ProviderCustom,
				APIBase:         "https://api.example.com",
				APIKeyEncrypted: "key",
			}
			require.NoError(t, providerRepo.Create(provider))
		}

		providers, err := providerRepo.FindByUserID(user.ID)

		require.NoError(t, err)
		assert.GreaterOrEqual(t, len(providers), 2)
	})

	t.Run("FindByID", func(t *testing.T) {
		provider := &models.Provider{
			ID:              uuid.New(),
			UserID:          user.ID,
			Name:            "Find By ID",
			Type:            models.ProviderCustom,
			APIBase:         "https://api.example.com",
			APIKeyEncrypted: "key",
		}
		require.NoError(t, providerRepo.Create(provider))

		found, err := providerRepo.FindByID(provider.ID)

		require.NoError(t, err)
		require.NotNil(t, found)
		assert.Equal(t, provider.ID, found.ID)
		assert.Equal(t, "Find By ID", found.Name)
	})

	t.Run("FindByID_NotExists", func(t *testing.T) {
		found, err := providerRepo.FindByID(uuid.New())

		assert.Error(t, err)
		assert.Nil(t, found)
	})

	t.Run("FindByIDAndUserID", func(t *testing.T) {
		provider := &models.Provider{
			ID:              uuid.New(),
			UserID:          user.ID,
			Name:            "Owner Test",
			Type:            models.ProviderCustom,
			APIBase:         "https://api.example.com",
			APIKeyEncrypted: "key",
		}
		require.NoError(t, providerRepo.Create(provider))

		// Find with correct user
		found, err := providerRepo.FindByIDAndUserID(provider.ID, user.ID)
		require.NoError(t, err)
		assert.NotNil(t, found)

		// Find with wrong user
		found, err = providerRepo.FindByIDAndUserID(provider.ID, 999999)
		assert.Error(t, err)
		assert.Nil(t, found)
	})

	t.Run("Update", func(t *testing.T) {
		provider := &models.Provider{
			ID:              uuid.New(),
			UserID:          user.ID,
			Name:            "Original Name",
			Type:            models.ProviderCustom,
			APIBase:         "https://api.example.com",
			APIKeyEncrypted: "key",
		}
		require.NoError(t, providerRepo.Create(provider))

		provider.Name = "Updated Name"
		err := providerRepo.Update(provider)

		require.NoError(t, err)

		found, _ := providerRepo.FindByID(provider.ID)
		assert.Equal(t, "Updated Name", found.Name)
	})

	t.Run("Delete", func(t *testing.T) {
		provider := &models.Provider{
			ID:              uuid.New(),
			UserID:          user.ID,
			Name:            "To Delete",
			Type:            models.ProviderCustom,
			APIBase:         "https://api.example.com",
			APIKeyEncrypted: "key",
		}
		require.NoError(t, providerRepo.Create(provider))

		err := providerRepo.Delete(provider.ID, user.ID)

		require.NoError(t, err)

		found, err := providerRepo.FindByID(provider.ID)
		assert.Error(t, err)
		assert.Nil(t, found)
	})
}

func TestProviderModelRepository(t *testing.T) {
	cleanup := testutil.SetupTestDB(t)
	defer cleanup()

	providerRepo := NewProviderRepository()
	modelRepo := NewProviderModelRepository()
	userRepo := NewUserRepository()

	user := &models.User{
		Email:        "model_test@example.com",
		PasswordHash: "hash",
	}
	require.NoError(t, userRepo.Create(user))

	provider := &models.Provider{
		ID:              uuid.New(),
		UserID:          user.ID,
		Name:            "Model Test Provider",
		Type:            models.ProviderCustom,
		APIBase:         "https://api.example.com",
		APIKeyEncrypted: "key",
	}
	require.NoError(t, providerRepo.Create(provider))

	t.Run("Create", func(t *testing.T) {
		model := &models.ProviderModel{
			ID:          uuid.New(),
			ProviderID:  provider.ID,
			ModelID:     "gpt-4",
			DisplayName: "GPT-4",
			Enabled:     true,
		}

		err := modelRepo.Create(model)

		require.NoError(t, err)
		assert.NotEqual(t, uuid.Nil, model.ID)
	})

	t.Run("FindByProviderID", func(t *testing.T) {
		// Create models
		for i := 0; i < 3; i++ {
			model := &models.ProviderModel{
				ID:          uuid.New(),
				ProviderID:  provider.ID,
				ModelID:     "model",
				DisplayName: "Model",
				Enabled:     true,
			}
			require.NoError(t, modelRepo.Create(model))
		}

		models, err := modelRepo.FindByProviderID(provider.ID)

		require.NoError(t, err)
		assert.GreaterOrEqual(t, len(models), 3)
	})

	t.Run("FindByID", func(t *testing.T) {
		model := &models.ProviderModel{
			ID:          uuid.New(),
			ProviderID:  provider.ID,
			ModelID:     "find-test",
			DisplayName: "Find Test",
			Enabled:     true,
		}
		require.NoError(t, modelRepo.Create(model))

		found, err := modelRepo.FindByID(model.ID)

		require.NoError(t, err)
		require.NotNil(t, found)
		assert.Equal(t, model.ID, found.ID)
	})

	t.Run("Update", func(t *testing.T) {
		model := &models.ProviderModel{
			ID:          uuid.New(),
			ProviderID:  provider.ID,
			ModelID:     "update-test",
			DisplayName: "Original",
			Enabled:     true,
		}
		require.NoError(t, modelRepo.Create(model))

		model.DisplayName = "Updated"
		err := modelRepo.Update(model)

		require.NoError(t, err)

		found, _ := modelRepo.FindByID(model.ID)
		assert.Equal(t, "Updated", found.DisplayName)
	})

	t.Run("Delete", func(t *testing.T) {
		model := &models.ProviderModel{
			ID:          uuid.New(),
			ProviderID:  provider.ID,
			ModelID:     "delete-test",
			DisplayName: "To Delete",
			Enabled:     true,
		}
		require.NoError(t, modelRepo.Create(model))

		err := modelRepo.Delete(model.ID, provider.ID)

		require.NoError(t, err)

		found, err := modelRepo.FindByID(model.ID)
		assert.Error(t, err)
		assert.Nil(t, found)
	})

	t.Run("SetDefault", func(t *testing.T) {
		// Create models
		var modelIDs []uuid.UUID
		for i := 0; i < 3; i++ {
			model := &models.ProviderModel{
				ID:          uuid.New(),
				ProviderID:  provider.ID,
				ModelID:     "default-test",
				DisplayName: "Default Test",
				Enabled:     true,
				IsDefault:   i == 0,
			}
			require.NoError(t, modelRepo.Create(model))
			modelIDs = append(modelIDs, model.ID)
		}

		// Set second model as default
		err := modelRepo.SetDefault(provider.ID, modelIDs[1])

		require.NoError(t, err)

		// Verify only second is default
		for i, id := range modelIDs {
			found, _ := modelRepo.FindByID(id)
			if i == 1 {
				assert.True(t, found.IsDefault)
			} else {
				assert.False(t, found.IsDefault)
			}
		}
	})

	t.Run("BatchCreate", func(t *testing.T) {
		models := []models.ProviderModel{
			{
				ID:          uuid.New(),
				ProviderID:  provider.ID,
				ModelID:     "batch1",
				DisplayName: "Batch 1",
				Enabled:     true,
			},
			{
				ID:          uuid.New(),
				ProviderID:  provider.ID,
				ModelID:     "batch2",
				DisplayName: "Batch 2",
				Enabled:     true,
			},
		}

		err := modelRepo.BatchCreate(models)

		require.NoError(t, err)
		assert.NotEqual(t, uuid.Nil, models[0].ID)
		assert.NotEqual(t, uuid.Nil, models[1].ID)
	})
}

func TestProviderModelRepository_Sync(t *testing.T) {
	cleanup := testutil.SetupTestDB(t)
	defer cleanup()

	providerRepo := NewProviderRepository()
	modelRepo := NewProviderModelRepository()
	userRepo := NewUserRepository()
	convRepo := NewConversationRepository()

	user := &models.User{
		Email:        "sync_test@example.com",
		PasswordHash: "hash",
	}
	require.NoError(t, userRepo.Create(user))

	provider := &models.Provider{
		ID:              uuid.New(),
		UserID:          user.ID,
		Name:            "Sync Test Provider",
		Type:            models.ProviderCustom,
		APIBase:         "https://api.example.com",
		APIKeyEncrypted: "key",
	}
	require.NoError(t, providerRepo.Create(provider))

	t.Run("Sync_HardDelete_UpdatesConversations", func(t *testing.T) {
		// Create models
		model1ID := uuid.New()
		model2ID := uuid.New()
		model1 := &models.ProviderModel{
			ID:          model1ID,
			ProviderID:  provider.ID,
			ModelID:     "gpt-4o",
			DisplayName: "GPT-4o",
			Enabled:     true,
			IsDefault:   true,
		}
		model2 := &models.ProviderModel{
			ID:          model2ID,
			ProviderID:  provider.ID,
			ModelID:     "gpt-4o-mini",
			DisplayName: "GPT-4o Mini",
			Enabled:     true,
		}
		require.NoError(t, modelRepo.Create(model1))
		require.NoError(t, modelRepo.Create(model2))

		// Create conversations associated with model1
		conv1 := &models.Conversation{
			UserID:          user.ID,
			ProviderModelID: &model1ID,
			ModelID:         "gpt-4o",
			Title:           "Conv with GPT-4o",
		}
		conv2 := &models.Conversation{
			UserID:          user.ID,
			ProviderModelID: &model1ID,
			ModelID:         "gpt-4o",
			Title:           "Another Conv with GPT-4o",
		}
		conv3 := &models.Conversation{
			UserID:          user.ID,
			ProviderModelID: &model2ID,
			ModelID:         "gpt-4o-mini",
			Title:           "Conv with GPT-4o-mini",
		}
		require.NoError(t, convRepo.Create(conv1))
		require.NoError(t, convRepo.Create(conv2))
		require.NoError(t, convRepo.Create(conv3))

		// Delete model1 using Sync (hard delete)
		result, err := modelRepo.Sync(
			provider.ID,
			nil,           // modelsToAdd
			[]uuid.UUID{model1ID}, // deleteIDs
			uuid.Nil,      // defaultModelID
			-1,            // newDefaultModelIndex
			nil,           // enableIDs
			nil,           // disableIDs
		)

		require.NoError(t, err)
		assert.Equal(t, 1, result.Deleted)

		// Verify model1 is hard deleted
		_, err = modelRepo.FindByID(model1ID)
		assert.Error(t, err, "model should be hard deleted")

		// Verify conversations with model1 now have NULL provider_model_id but model_id is preserved
		var updatedConv1, updatedConv2, updatedConv3 models.Conversation
		database.DB.First(&updatedConv1, conv1.ID)
		database.DB.First(&updatedConv2, conv2.ID)
		database.DB.First(&updatedConv3, conv3.ID)

		assert.Nil(t, updatedConv1.ProviderModelID, "provider_model_id should be NULL after model deletion")
		assert.Equal(t, "gpt-4o", updatedConv1.ModelID, "model_id snapshot should be preserved")

		assert.Nil(t, updatedConv2.ProviderModelID, "provider_model_id should be NULL after model deletion")
		assert.Equal(t, "gpt-4o", updatedConv2.ModelID, "model_id snapshot should be preserved")

		assert.NotNil(t, updatedConv3.ProviderModelID, "provider_model_id should remain for conv3 (model2 not deleted)")
		assert.Equal(t, model2ID, *updatedConv3.ProviderModelID)
	})

	t.Run("Sync_EnableDisable", func(t *testing.T) {
		// Create a disabled model
		modelID := uuid.New()
		model := &models.ProviderModel{
			ID:          modelID,
			ProviderID:  provider.ID,
			ModelID:     "test-model",
			DisplayName: "Test Model",
			Enabled:     false,
		}
		require.NoError(t, modelRepo.Create(model))

		// Enable the model
		result, err := modelRepo.Sync(
			provider.ID,
			nil,
			nil,
			uuid.Nil,
			-1,
			[]uuid.UUID{modelID}, // enableIDs
			nil,
		)

		require.NoError(t, err)
		assert.Equal(t, 1, result.Enabled)

		// Verify model is enabled
		enabledModel, err := modelRepo.FindByID(modelID)
		require.NoError(t, err)
		assert.True(t, enabledModel.Enabled)

		// Disable the model
		result, err = modelRepo.Sync(
			provider.ID,
			nil,
			nil,
			uuid.Nil,
			-1,
			nil,
			[]uuid.UUID{modelID}, // disableIDs
		)

		require.NoError(t, err)
		assert.Equal(t, 1, result.Disabled)

		// Verify model is disabled
		disabledModel, err := modelRepo.FindByID(modelID)
		require.NoError(t, err)
		assert.False(t, disabledModel.Enabled)
	})

	t.Run("Sync_ComplexOperations", func(t *testing.T) {
		// Create initial models
		model1ID := uuid.New()
		model2ID := uuid.New()
		model1 := &models.ProviderModel{
			ID:          model1ID,
			ProviderID:  provider.ID,
			ModelID:     "complex-1",
			DisplayName: "Complex 1",
			Enabled:     true,
		}
		model2 := &models.ProviderModel{
			ID:          model2ID,
			ProviderID:  provider.ID,
			ModelID:     "complex-2",
			DisplayName: "Complex 2",
			Enabled:     false,
		}
		require.NoError(t, modelRepo.Create(model1))
		require.NoError(t, modelRepo.Create(model2))

		// Perform complex sync: add new, delete one, enable one, disable one, set default
		newModelID := uuid.New()
		modelsToAdd := []models.ProviderModel{
			{
				ID:          newModelID,
				ProviderID:  provider.ID,
				ModelID:     "new-model",
				DisplayName: "New Model",
				Enabled:     true,
			},
		}

		result, err := modelRepo.Sync(
			provider.ID,
			modelsToAdd,
			[]uuid.UUID{model1ID},     // delete model1
			uuid.Nil,
			0,                          // set new model as default
			[]uuid.UUID{model2ID},     // enable model2
			nil,
		)

		require.NoError(t, err)
		assert.Equal(t, 1, result.Added)
		assert.Equal(t, 1, result.Deleted)
		assert.Equal(t, 1, result.Enabled)
		assert.Equal(t, 1, result.Updated) // default changed

		// Verify final state
		_, err = modelRepo.FindByID(model1ID)
		assert.Error(t, err, "model1 should be deleted")

		enabledModel2, err := modelRepo.FindByID(model2ID)
		require.NoError(t, err)
		assert.True(t, enabledModel2.Enabled)

		newModel, err := modelRepo.FindByID(newModelID)
		require.NoError(t, err)
		assert.True(t, newModel.IsDefault)
	})
}
