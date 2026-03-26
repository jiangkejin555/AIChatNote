package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

type VersionChange struct {
	Type        string `json:"type"`
	Description string `json:"description"`
}

type VersionChanges []VersionChange

func (v VersionChanges) Value() (driver.Value, error) {
	return json.Marshal(v)
}

func (v *VersionChanges) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(bytes, v)
}

type Version struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Version     string         `gorm:"not null;size:50" json:"version"`
	ReleaseDate time.Time      `gorm:"not null;type:date" json:"release_date"`
	Changes     VersionChanges `gorm:"not null;type:jsonb" json:"changes"`
	CreatedAt   time.Time      `json:"created_at"`
}

func (Version) TableName() string {
	return "versions"
}
