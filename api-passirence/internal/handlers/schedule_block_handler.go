package handlers

import (
	"api-passirence/internal/apperror"
	"api-passirence/internal/dtos"
	"api-passirence/internal/response"
	"api-passirence/internal/schedule"
	"api-passirence/internal/services"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type ScheduleBlockHandler struct {
	service *services.ScheduleBlockService
}

func NewScheduleBlockHandler() *ScheduleBlockHandler {
	return &ScheduleBlockHandler{
		service: services.NewScheduleBlockService(),
	}
}

func (h *ScheduleBlockHandler) Create(c *gin.Context) {
	var req dtos.CreateScheduleBlockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, apperror.Validation("JSON inválido: "+err.Error()))
		return
	}

	result, err := h.service.Create(c.Request.Context(), &req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.JSON(c, http.StatusCreated, result)
}

func (h *ScheduleBlockHandler) List(c *gin.Context) {
	filter, err := parseScheduleBlockListFilter(c)
	if err != nil {
		response.Error(c, err)
		return
	}

	blocks, err := h.service.List(c.Request.Context(), filter)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.JSON(c, http.StatusOK, blocks)
}

func (h *ScheduleBlockHandler) GetByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		response.Error(c, apperror.Validation("id inválido"))
		return
	}

	result, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.JSON(c, http.StatusOK, result)
}

func (h *ScheduleBlockHandler) Update(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		response.Error(c, apperror.Validation("id inválido"))
		return
	}

	var req dtos.UpdateScheduleBlockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, apperror.Validation("JSON inválido: "+err.Error()))
		return
	}

	result, err := h.service.Update(c.Request.Context(), id, &req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.JSON(c, http.StatusOK, result)
}

func (h *ScheduleBlockHandler) Delete(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		response.Error(c, apperror.Validation("id inválido"))
		return
	}

	if err := h.service.Delete(c.Request.Context(), id); err != nil {
		response.Error(c, err)
		return
	}

	response.JSON(c, http.StatusOK, gin.H{"message": "Bloqueio removido com sucesso"})
}

func parseScheduleBlockListFilter(c *gin.Context) (dtos.ScheduleBlockListFilter, error) {
	filter := dtos.ScheduleBlockListFilter{
		Date: c.Query("date"),
		Type: c.Query("type"),
	}

	if raw := c.Query("professionalId"); raw != "" {
		id, err := strconv.Atoi(raw)
		if err != nil || id <= 0 {
			return filter, apperror.Validation("professionalId inválido")
		}
		filter.ProfessionalID = &id
	}

	if raw := c.Query("isRecurring"); raw != "" {
		value, err := strconv.ParseBool(raw)
		if err != nil {
			return filter, apperror.Validation("isRecurring inválido")
		}
		filter.IsRecurring = &value
	}

	if filter.Date != "" {
		if err := validateDateQuery(filter.Date); err != nil {
			return filter, err
		}
	}

	return filter, nil
}

func validateDateQuery(date string) error {
	if _, err := time.Parse(schedule.DateLayout, date); err != nil {
		return apperror.Validation("date inválida, use o formato YYYY-MM-DD")
	}
	return nil
}
