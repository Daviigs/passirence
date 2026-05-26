package handlers

import (
	"api-passirence/internal/apperror"
	"api-passirence/internal/dtos"
	"api-passirence/internal/response"
	"api-passirence/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type AppointmentHandler struct {
	service *services.AppointmentService
}

func NewAppointmentHandler() *AppointmentHandler {
	return &AppointmentHandler{
		service: services.NewAppointmentService(),
	}
}

func (h *AppointmentHandler) List(c *gin.Context) {
	filters, err := services.ParseAppointmentFilters(map[string]string{
		"date":           c.Query("date"),
		"professionalId": c.Query("professionalId"),
		"clientId":       c.Query("clientId"),
		"status":         c.Query("status"),
	})
	if err != nil {
		response.Error(c, err)
		return
	}

	appointments, err := h.service.List(c.Request.Context(), filters)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.JSON(c, http.StatusOK, appointments)
}

func (h *AppointmentHandler) GetByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		response.Error(c, apperror.Validation("id inválido"))
		return
	}

	appointment, err := h.service.GetByID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.JSON(c, http.StatusOK, appointment)
}

func (h *AppointmentHandler) GetAvailableDates(c *gin.Context) {
	dates, err := h.service.GetAvailableDates(c.Request.Context())
	if err != nil {
		response.Error(c, err)
		return
	}

	response.JSON(c, http.StatusOK, dates)
}

func (h *AppointmentHandler) GetAvailableTimes(c *gin.Context) {
	date := c.Query("date")
	professionalID, err := strconv.Atoi(c.Query("professionalId"))
	if err != nil || professionalID <= 0 {
		response.Error(c, apperror.Validation("professionalId inválido"))
		return
	}

	serviceIDs, err := services.ParseServiceIDsParam(c.Query("serviceIds"))
	if err != nil {
		response.Error(c, err)
		return
	}

	times, err := h.service.GetAvailableTimes(
		c.Request.Context(),
		date,
		professionalID,
		serviceIDs,
	)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.JSON(c, http.StatusOK, times)
}

func (h *AppointmentHandler) CreateAppointment(c *gin.Context) {
	var req dtos.CreateAppointmentRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, apperror.Validation("JSON inválido: "+err.Error()))
		return
	}

	result, err := h.service.CreateAppointment(c.Request.Context(), &req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.JSON(c, http.StatusCreated, result)
}

func (h *AppointmentHandler) UpdateAppointment(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		response.Error(c, apperror.Validation("id inválido"))
		return
	}

	var req dtos.UpdateAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, apperror.Validation("JSON inválido: "+err.Error()))
		return
	}

	result, err := h.service.UpdateAppointment(c.Request.Context(), id, &req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.JSON(c, http.StatusOK, result)
}

func (h *AppointmentHandler) CancelAppointment(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		response.Error(c, apperror.Validation("id inválido"))
		return
	}

	result, err := h.service.CancelAppointment(c.Request.Context(), id)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.JSON(c, http.StatusOK, result)
}

func (h *AppointmentHandler) FinishAppointment(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil || id <= 0 {
		response.Error(c, apperror.Validation("id inválido"))
		return
	}

	result, err := h.service.FinishAppointment(c.Request.Context(), id)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.JSON(c, http.StatusOK, result)
}
