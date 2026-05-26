package routes

import (
	"api-passirence/internal/handlers"

	"github.com/gin-gonic/gin"
)

func ClienteRoutes(router *gin.RouterGroup) {
	router.GET("/by-phone", handlers.GetClienteByPhoneHandler)
	router.GET("", handlers.GetClientesHandler)
	router.GET("/ativos", handlers.GetClientesAtivosHandler)
}

func CreateClienteRoutes(router *gin.RouterGroup) {
	router.POST("", handlers.CreateClienteHandler)
}

func UpdateClienteRoutes(router *gin.RouterGroup) {
	router.PUT("/:id", handlers.UpdateClienteHandler)
}

func DeleteClienteRoutes(router *gin.RouterGroup) {
	router.DELETE("/:id", handlers.DeleteClienteHandler)
}

func ActiveOrInactiveClienteRoutes(router *gin.RouterGroup) {
	router.PATCH("/:id/toggle", handlers.ToggleAtivoClienteHandler)
}
