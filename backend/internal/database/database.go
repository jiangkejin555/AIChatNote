package database

import (
	"fmt"
	"log"
	"time"

	"github.com/chat-note/backend/internal/config"
	"github.com/chat-note/backend/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect(cfg *config.Config) error {
	var err error

	gormConfig := &gorm.Config{}
	if cfg.Server.GinMode == "debug" {
		gormConfig.Logger = logger.Default.LogMode(logger.Info)
	} else {
		gormConfig.Logger = logger.Default.LogMode(logger.Silent)
	}

	// Build DSN from config
	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.DBName,
		cfg.Database.SSLMode,
	)

	DB, err = gorm.Open(postgres.Open(dsn), gormConfig)
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	// Configure connection pool
	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get sql.DB: %w", err)
	}

	if cfg.Database.MaxOpenConns > 0 {
		sqlDB.SetMaxOpenConns(cfg.Database.MaxOpenConns)
	}
	if cfg.Database.MaxIdleConns > 0 {
		sqlDB.SetMaxIdleConns(cfg.Database.MaxIdleConns)
	}
	if cfg.Database.ConnMaxLifetime > 0 {
		sqlDB.SetConnMaxLifetime(time.Duration(cfg.Database.ConnMaxLifetime) * time.Second)
	}

	log.Println("Connected to PostgreSQL database")
	return nil
}

// Migrate runs auto migration for all models
func Migrate() error {
	err := DB.AutoMigrate(
		&models.User{},
		&models.Provider{},
		&models.ProviderModel{},
		&models.Conversation{},
		&models.Message{},
		&models.MessageRequest{},
		&models.ConversationSummary{},
		&models.Note{},
		&models.Folder{},
		&models.RefreshToken{},
		&models.NoteTag{},
		&models.Feedback{},
		&models.SatisfactionRating{},
		&models.Version{},
		&models.FeatureRequest{},
		&models.FeatureVote{},
		&models.UserSettings{},
		&models.Notification{},
	)
	if err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	// Update foreign key constraint for notes.source_conversation_id to SET NULL on delete
	if err := updateNoteConversationFK(); err != nil {
		return fmt.Errorf("failed to update note conversation foreign key: %w", err)
	}

	log.Println("Database migration completed")
	return nil
}

// updateNoteConversationFK updates the foreign key constraint on notes table
// to SET NULL when the referenced conversation is deleted
func updateNoteConversationFK() error {
	// Drop the existing constraint and recreate with SET NULL
	sql := `
		DO $$
		BEGIN
			-- Check if the old constraint exists
			IF EXISTS (
				SELECT 1 FROM information_schema.table_constraints
				WHERE constraint_name = 'fk_notes_source_conversation'
				AND table_name = 'notes'
			) THEN
				ALTER TABLE notes DROP CONSTRAINT fk_notes_source_conversation;
			END IF;

			-- Check if the auto-generated constraint exists (GORM style)
			IF EXISTS (
				SELECT 1 FROM information_schema.table_constraints
				WHERE constraint_name LIKE 'fk_notes_source_conversation%'
				AND table_name = 'notes'
			) THEN
				EXECUTE 'ALTER TABLE notes DROP CONSTRAINT ' || (
					SELECT constraint_name FROM information_schema.table_constraints
					WHERE constraint_name LIKE 'fk_notes_source_conversation%'
					AND table_name = 'notes'
					LIMIT 1
				);
			END IF;
		END $$;

		-- Add the new constraint with SET NULL on delete
		ALTER TABLE notes
		ADD CONSTRAINT fk_notes_source_conversation
		FOREIGN KEY (source_conversation_id) REFERENCES conversations(id)
		ON DELETE SET NULL;
	`
	return DB.Exec(sql).Error
}
