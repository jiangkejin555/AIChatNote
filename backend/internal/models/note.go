package models

import (
	"time"
)

type Note struct {
	ID                   uint       `gorm:"primaryKey" json:"id"`
	UserID               uint       `gorm:"not null;index" json:"user_id"`
	FolderID             *uint      `gorm:"index" json:"folder_id"`
	SourceConversationID *uint      `json:"source_conversation_id"`
	Title                string     `gorm:"size:500;not null" json:"title"`
	Content              string     `gorm:"type:text;not null" json:"content"`
	Tags                 []NoteTag  `gorm:"foreignKey:NoteID;constraint:OnDelete:CASCADE" json:"tags"`
	CreatedAt            time.Time  `json:"created_at"`
	UpdatedAt            time.Time  `json:"updated_at"`

	Folder             *Folder        `gorm:"foreignKey:FolderID" json:"-"`
	SourceConversation *Conversation  `gorm:"foreignKey:SourceConversationID;constraint:OnDelete:SET NULL" json:"-"`
}

func (Note) TableName() string {
	return "notes"
}
