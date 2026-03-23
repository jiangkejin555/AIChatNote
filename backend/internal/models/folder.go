package models

import (
	"time"
)

type Folder struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	UserID    uint       `gorm:"not null;index" json:"user_id"`
	Name      string     `gorm:"not null;size:255" json:"name"`
	ParentID  *uint      `gorm:"index" json:"parent_id"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`

	Parent   *Folder   `gorm:"foreignKey:ParentID" json:"-"`
	Children []Folder  `gorm:"foreignKey:ParentID" json:"children,omitempty"`
}

func (Folder) TableName() string {
	return "folders"
}
