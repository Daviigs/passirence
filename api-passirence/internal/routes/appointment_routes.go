package routes

import (
	"api-passirence/internal/handlers"

	"github.com/gin-gonic/gin"
)

func AppointmentRoutes(router *gin.RouterGroup) {
	handler := handlers.NewAppointmentHandler()

	router.GET("/available-dates", handler.GetAvailableDates)
	router.GET("/available-times", handler.GetAvailableTimes)
	router.GET("", handler.List)
	router.POST("", handler.CreateAppointment)
	router.GET("/:id", handler.GetByID)
	router.PUT("/:id", handler.UpdateAppointment)
	router.PATCH("/:id/cancel", handler.CancelAppointment)
	router.PATCH("/:id/finish", handler.FinishAppointment)
}
