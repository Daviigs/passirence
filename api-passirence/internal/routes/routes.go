package routes

import (
	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	profissionais := r.Group("/profissionais")
	ProfissionalRoutes(profissionais)
	CreateProfissionalRoutes(profissionais)
	UpdateProfissionalRoutes(profissionais)
	DeleteProfissionalRoutes(profissionais)
	ActiveOrInactiveProfissionalRoutes(profissionais)

	servicos := r.Group("/servicos")
	CreateServicoRoutes(servicos)
	GetServicosRoutes(servicos)
	DeleteServicoRoutes(servicos)
	UpdateServicoRoutes(servicos)

	clientes := r.Group("/clientes")
	ClienteRoutes(clientes)
	CreateClienteRoutes(clientes)
	UpdateClienteRoutes(clientes)
	DeleteClienteRoutes(clientes)
	ActiveOrInactiveClienteRoutes(clientes)

	settings := r.Group("/settings")
	SettingsRoutes(settings)

	appointments := r.Group("/appointments")
	AppointmentRoutes(appointments)

	scheduleBlocks := r.Group("/schedule-blocks")
	ScheduleBlockRoutes(scheduleBlocks)
}
