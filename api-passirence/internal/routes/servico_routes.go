package routes

import (
	"api-passirence/internal/handlers"

	"github.com/gin-gonic/gin"
)

func CreateServicoRoutes(router *gin.RouterGroup) {
	router.POST("", handlers.CreateServicoHandler)
}

func GetServicosRoutes(router *gin.RouterGroup) {
	router.GET("", handlers.GetAllServicosHandler)
}

func DeleteServicoRoutes(router *gin.RouterGroup) {
	router.DELETE("/:id", handlers.DeleteServicoHandler)
}

func UpdateServicoRoutes(router *gin.RouterGroup) {
	router.PUT("/:id", handlers.UpdateServicoHandler)
}
