package routes

import (
	"api-passirence/internal/handlers"

	"github.com/gin-gonic/gin"
)

func ScheduleBlockRoutes(router *gin.RouterGroup) {
	handler := handlers.NewScheduleBlockHandler()

	router.POST("", handler.Create)
	router.GET("", handler.List)
	router.GET("/:id", handler.GetByID)
	router.PUT("/:id", handler.Update)
	router.DELETE("/:id", handler.Delete)
}
