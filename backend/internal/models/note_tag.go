package models

import (
	"time"
)

type NoteTag struct {
	NoteID    uint      `gorm:"primaryKey" json:"note_id"`
	Tag       string    `gorm:"primaryKey;size:100" json:"tag"`
	CreatedAt time.Time `json:"created_at"`

	Note *Note `gorm:"foreignKey:NoteID" json:"-"`
}

func (NoteTag) TableName() string {
	return "note_tags"
}

// Tag represents a tag with its usage count (for listing purposes)
type Tag struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}
