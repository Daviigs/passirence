package handlers

import (
	"api-passirence/internal/apperror"
	"api-passirence/internal/dtos"
	"api-passirence/internal/response"
	"api-passirence/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type SettingsHandler struct {
	service *services.SettingsService
}

func NewSettingsHandler() *SettingsHandler {
	return &SettingsHandler{
		service: services.NewSettingsService(),
	}
}

func (h *SettingsHandler) GetSettings(c *gin.Context) {
	result, err := h.service.GetSettings(c.Request.Context())
	if err != nil {
		response.Error(c, err)
		return
	}

	response.JSON(c, http.StatusOK, result)
}

func (h *SettingsHandler) UpdateSettings(c *gin.Context) {
	var req dtos.UpdateSettingsRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, apperror.Validation("JSON inválido: "+err.Error()))
		return
	}

	result, err := h.service.UpdateSettings(c.Request.Context(), &req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.JSON(c, http.StatusOK, result)
}
