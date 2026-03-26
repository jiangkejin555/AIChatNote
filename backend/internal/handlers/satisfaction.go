package handlers

import (
	"net/http"

	"github.com/chat-note/backend/internal/middleware"
	"github.com/chat-note/backend/internal/models"
	"github.com/chat-note/backend/internal/repository"
	"github.com/chat-note/backend/internal/utils"
	"github.com/gin-gonic/gin"
)

type SatisfactionHandler struct {
	repo *repository.SatisfactionRatingRepository
}

func NewSatisfactionHandler() *SatisfactionHandler {
	return &SatisfactionHandler{
		repo: repository.NewSatisfactionRatingRepository(),
	}
}

type SatisfactionRatingRequest struct {
	Rating  int    `json:"rating" binding:"required,min=1,max=5"`
	Comment string `json:"comment"`
}

type SatisfactionRatingResponse struct {
	*models.SatisfactionRating
}

func (h *SatisfactionHandler) Get(c *gin.Context) {
	userID := middleware.GetUserID(c)

	rating, err := h.repo.FindByUserID(userID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"rating": nil})
		return
	}

	c.JSON(http.StatusOK, SatisfactionRatingResponse{rating})
}

func (h *SatisfactionHandler) CreateOrUpdate(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req SatisfactionRatingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	rating := &models.SatisfactionRating{
		UserID:  userID,
		Rating:  req.Rating,
		Comment: req.Comment,
	}

	if err := h.repo.CreateOrUpdate(rating); err != nil {
		utils.LogOperationError("SatisfactionHandler", "CreateOrUpdate", err, "userID", userID)
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "save_error", "Failed to save rating", err)
		return
	}

	utils.LogOperationSuccess("SatisfactionHandler", "CreateOrUpdate", "userID", userID, "rating", req.Rating)
	c.JSON(http.StatusOK, SatisfactionRatingResponse{rating})
}
