package handlers

import (
	"net/http"

	"github.com/chat-note/backend/internal/repository"
	"github.com/chat-note/backend/internal/utils"
	"github.com/gin-gonic/gin"
)

type VersionHandler struct {
	repo *repository.VersionRepository
}

func NewVersionHandler() *VersionHandler {
	return &VersionHandler{
		repo: repository.NewVersionRepository(),
	}
}

type VersionResponse struct {
	ID          uint        `json:"id"`
	Version     string      `json:"version"`
	ReleaseDate string      `json:"release_date"`
	Changes     interface{} `json:"changes"`
	CreatedAt   string      `json:"created_at"`
}

type VersionListResponse struct {
	Data []VersionResponse `json:"data"`
}

func (h *VersionHandler) List(c *gin.Context) {
	versions, err := h.repo.FindAll()
	if err != nil {
		utils.LogOperationError("VersionHandler", "List", err)
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "fetch_error", "Failed to fetch versions", err)
		return
	}

	var response []VersionResponse
	for _, v := range versions {
		response = append(response, VersionResponse{
			ID:          v.ID,
			Version:     v.Version,
			ReleaseDate: v.ReleaseDate.Format("2006-01-02"),
			Changes:     v.Changes,
			CreatedAt:   v.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		})
	}

	c.JSON(http.StatusOK, VersionListResponse{Data: response})
}

func (h *VersionHandler) GetCurrent(c *gin.Context) {
	version, err := h.repo.FindLatest()
	if err != nil {
		utils.LogOperationError("VersionHandler", "GetCurrent", err)
		c.JSON(http.StatusOK, gin.H{"version": nil})
		return
	}

	c.JSON(http.StatusOK, VersionResponse{
		ID:          version.ID,
		Version:     version.Version,
		ReleaseDate: version.ReleaseDate.Format("2006-01-02"),
		Changes:     version.Changes,
		CreatedAt:   version.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	})
}
