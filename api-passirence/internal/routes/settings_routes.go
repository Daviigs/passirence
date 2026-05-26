package routes

import (
	"api-passirence/internal/handlers"

	"github.com/gin-gonic/gin"
)

func SettingsRoutes(router *gin.RouterGroup) {
	handler := handlers.NewSettingsHandler()

	router.GET("", handler.GetSettings)
	router.PUT("", handler.UpdateSettings)
}
