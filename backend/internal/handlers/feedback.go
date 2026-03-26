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

type FeedbackHandler struct {
	repo *repository.FeedbackRepository
}

func NewFeedbackHandler() *FeedbackHandler {
	return &FeedbackHandler{
		repo: repository.NewFeedbackRepository(),
	}
}

type CreateFeedbackRequest struct {
	Type        string `json:"type" binding:"required,oneof=bug feature other"`
	Title       string `json:"title" binding:"required,max=255"`
	Description string `json:"description" binding:"required"`
	Contact     string `json:"contact"`
}

type UpdateFeedbackRequest struct {
	Title       string `json:"title" binding:"omitempty,max=255"`
	Description string `json:"description" binding:"omitempty"`
}

type FeedbackResponse struct {
	*models.Feedback
}

type FeedbackListResponse struct {
	Data     []models.Feedback `json:"data"`
	Total    int64             `json:"total"`
	Page     int               `json:"page"`
	PageSize int               `json:"page_size"`
}

func (h *FeedbackHandler) List(c *gin.Context) {
	userID := middleware.GetUserID(c)

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	feedbacks, total, err := h.repo.FindByUserID(userID, page, pageSize)
	if err != nil {
		utils.LogOperationError("FeedbackHandler", "List", err, "userID", userID)
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "fetch_error", "Failed to fetch feedbacks", err)
		return
	}

	c.JSON(http.StatusOK, FeedbackListResponse{
		Data:     feedbacks,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	})
}

func (h *FeedbackHandler) Get(c *gin.Context) {
	userID := middleware.GetUserID(c)
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid feedback ID")
		return
	}

	feedback, err := h.repo.FindByID(uint(id))
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusNotFound, "not_found", "Feedback not found", err)
		return
	}

	if feedback.UserID != userID {
		utils.SendError(c, http.StatusForbidden, "forbidden", "Access denied")
		return
	}

	c.JSON(http.StatusOK, FeedbackResponse{feedback})
}

func (h *FeedbackHandler) Create(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req CreateFeedbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	feedback := &models.Feedback{
		UserID:      userID,
		Type:        models.FeedbackType(req.Type),
		Title:       req.Title,
		Description: req.Description,
		Contact:     req.Contact,
		Status:      models.FeedbackStatusPending,
	}

	if err := h.repo.Create(feedback); err != nil {
		utils.LogOperationError("FeedbackHandler", "Create", err, "userID", userID)
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "create_error", "Failed to create feedback", err)
		return
	}

	utils.LogOperationSuccess("FeedbackHandler", "Create", "userID", userID, "feedbackID", feedback.ID)
	c.JSON(http.StatusCreated, FeedbackResponse{feedback})
}

func (h *FeedbackHandler) Update(c *gin.Context) {
	userID := middleware.GetUserID(c)
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_id", "Invalid feedback ID")
		return
	}

	feedback, err := h.repo.FindByID(uint(id))
	if err != nil {
		utils.SendErrorWithErr(c, http.StatusNotFound, "not_found", "Feedback not found", err)
		return
	}

	if feedback.UserID != userID {
		utils.SendError(c, http.StatusForbidden, "forbidden", "Access denied")
		return
	}

	if feedback.Status != models.FeedbackStatusPending {
		utils.SendError(c, http.StatusBadRequest, "cannot_update", "Can only update pending feedback")
		return
	}

	var req UpdateFeedbackRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.SendError(c, http.StatusBadRequest, "invalid_request", err.Error())
		return
	}

	if req.Title != "" {
		feedback.Title = req.Title
	}
	if req.Description != "" {
		feedback.Description = req.Description
	}

	if err := h.repo.Update(feedback); err != nil {
		utils.LogOperationError("FeedbackHandler", "Update", err, "userID", userID, "feedbackID", id)
		utils.SendErrorWithErr(c, http.StatusInternalServerError, "update_error", "Failed to update feedback", err)
		return
	}

	utils.LogOperationSuccess("FeedbackHandler", "Update", "userID", userID, "feedbackID", id)
	c.JSON(http.StatusOK, FeedbackResponse{feedback})
}
