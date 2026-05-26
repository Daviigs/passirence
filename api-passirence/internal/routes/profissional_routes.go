package routes

import (
	"api-passirence/internal/handlers"

	"github.com/gin-gonic/gin"
)

func ProfissionalRoutes(router *gin.RouterGroup) {
	router.GET("", handlers.GetProfissionaisHandler)
	router.GET("/ativos", handlers.GetProfissionaisAtivosHandler)
}

func CreateProfissionalRoutes(router *gin.RouterGroup) {
	router.POST("", handlers.CreateProfissionalHandler)
}

func UpdateProfissionalRoutes(router *gin.RouterGroup) {
	router.PUT("/:id", handlers.UpdateProfissionalHandler)
}

func DeleteProfissionalRoutes(router *gin.RouterGroup) {
	router.DELETE("/:id", handlers.DeleteProfissionalHandler)
}

func ActiveOrInactiveProfissionalRoutes(router *gin.RouterGroup) {
	router.PATCH("/:id/toggle", handlers.ToggleAtivoProfissionalHandler)
}
