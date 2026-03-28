package models

import (
	"time"

	"github.com/google/uuid"
)

type Integration struct {
	ID                uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID            uint      `gorm:"not null;uniqueIndex:idx_user_provider" json:"user_id"`
	Provider             string    `gorm:"size:255;not null;uniqueIndex:idx_user_provider" json:"provider"`
	AccessTokenEncrypted string    `gorm:"type:text;not null;column:access_token_encrypted" json:"-"`
	NotionWorkspaceID    *string   `gorm:"size:255" json:"notion_workspace_id"`
	NotionRootPageID  *string   `gorm:"size:255" json:"notion_root_page_id"`
	NotionAppPageID   *string   `gorm:"size:255" json:"notion_app_page_id"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`

	User *User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
}

func (Integration) TableName() string {
	return "user_integrations"
}
