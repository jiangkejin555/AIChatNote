package handlers

import (
	"net/http"
	"strconv"

	"github.com/chat-note/backend/internal/middleware"
	"github.com/chat-note/backend/internal/models"
	"github.com/chat-note/backend/internal/repository"
	"github.com/chat-note/backend/internal/utils"
	"github.com/gin-gonic/gin"
)

type FeatureHandler struct {
	repo *repository.FeatureRequestRepository
}

func NewFeatureHandler() *FeatureHandler {
	return &FeatureHandler{
		repo: repository.NewFeatureRequestRepository(),
	}
}

type FeatureResponse struct {
	ID          uint                 `json:"id"`
	Title       string               `json:"title"`
	Description string               `json:"description"`
	Status      models.FeatureStatus `json:"status"`
	VoteCount   int64                `json:"vote_count"`
	HasVoted    bool                 `json:"has_voted"`
	CreatedAt   string               `json:"created_at"`
}

type FeatureListResponse struct {
	Data []FeatureResponse `json:"data"`
}

func (h *FeatureHandler) List(c *gin.Context) {
	userID := middleware.GetUserID(c)

	features, err := h.repo.FindAll()
	if err != nil {
		utils.LogOperationError("FeatureHandler", "List", err, "userID", userID)
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "fetch_error", "Failed to fetch features", err)
		return
	}

	response := make([]FeatureResponse, 0)
	for _, f := range features {
		voteCount, _ := h.repo.GetVoteCount(f.ID)
		hasVoted, _ := h.repo.HasUserVoted(userID, f.ID)

		response = append(response, FeatureResponse{
			ID:          f.ID,
			Title:       f.Title,
			Description: f.Description,
			Status:      f.Status,
			VoteCount:   voteCount,
			HasVoted:    hasVoted,
			CreatedAt:   f.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		})
	}

	c.JSON(http.StatusOK, FeatureListResponse{Data: response})
}

func (h *FeatureHandler) Vote(c *gin.Context) {
	userID := middleware.GetUserID(c)
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid feature ID")
		return
	}

	feature, err := h.repo.FindByID(uint(id))
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusNotFound, "not_found", "Feature not found", err)
		return
	}

	hasVoted, err := h.repo.HasUserVoted(userID, feature.ID)
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "check_error", "Failed to check vote status", err)
		return
	}

	if hasVoted {
		utils.SendError(c, http.StatusBadRequest, "already_voted", "Already voted for this feature")
		return
	}

	vote := &models.FeatureVote{
		UserID:    userID,
		FeatureID: feature.ID,
	}

	if err := h.repo.CreateVote(vote); err != nil {
		utils.LogOperationError("FeatureHandler", "Vote", err, "userID", userID, "featureID", id)
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "vote_error", "Failed to vote", err)
		return
	}

	utils.LogOperationSuccess("FeatureHandler", "Vote", "userID", userID, "featureID", id)
	utils.SendSuccess(c, "Voted successfully")
}

func (h *FeatureHandler) Unvote(c *gin.Context) {
	userID := middleware.GetUserID(c)
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid feature ID")
		return
	}

	if err := h.repo.DeleteVote(userID, uint(id)); err != nil {
		utils.LogOperationError("FeatureHandler", "Unvote", err, "userID", userID, "featureID", id)
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "unvote_error", "Failed to remove vote", err)
		return
	}

	utils.LogOperationSuccess("FeatureHandler", "Unvote", "userID", userID, "featureID", id)
	utils.SendSuccess(c, "Vote removed successfully")
}
