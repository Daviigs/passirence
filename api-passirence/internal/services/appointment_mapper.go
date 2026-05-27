package services

import (
	"api-passirence/internal/apperror"
	"api-passirence/internal/dtos"
	"api-passirence/internal/models"
	"api-passirence/internal/repositories"
	"context"
)

func (s *AppointmentService) enrichAppointments(
	ctx context.Context,
	appointments []models.Appointment,
) ([]dtos.AppointmentResponse, error) {
	if len(appointments) == 0 {
		return []dtos.AppointmentResponse{}, nil
	}

	clientIDs := make([]int, 0, len(appointments))
	professionalIDs := make([]int, 0, len(appointments))
	serviceIDSet := make(map[int]struct{})

	for _, appointment := range appointments {
		clientIDs = append(clientIDs, appointment.ClientID)
		professionalIDs = append(professionalIDs, appointment.ProfessionalID)
		for _, link := range appointment.Services {
			serviceIDSet[link.ServiceID] = struct{}{}
		}
	}

	serviceIDs := make([]int, 0, len(serviceIDSet))
	for id := range serviceIDSet {
		serviceIDs = append(serviceIDs, id)
	}

	clientes, err := repositories.GetClientesByIDs(ctx, uniqueInts(clientIDs))
	if err != nil {
		return nil, apperror.Internal("falha ao buscar clientes")
	}

	profissionais, err := repositories.GetProfissionaisByIDs(ctx, uniqueInts(professionalIDs))
	if err != nil {
		return nil, apperror.Internal("falha ao buscar profissionais")
	}

	servicos, err := repositories.GetServicosByIDs(ctx, serviceIDs)
	if err != nil {
		return nil, apperror.Internal("falha ao buscar serviços")
	}

	clientByID := make(map[int]models.Cliente, len(clientes))
	for _, cliente := range clientes {
		clientByID[cliente.ID] = cliente
	}

	professionalByID := make(map[int]models.Profissional, len(profissionais))
	for _, profissional := range profissionais {
		professionalByID[profissional.ID] = profissional
	}

	servicoByID := make(map[int]models.Servico, len(servicos))
	for _, servico := range servicos {
		servicoByID[servico.ID] = servico
	}

	result := make([]dtos.AppointmentResponse, len(appointments))
	for i, appointment := range appointments {
		result[i] = mapAppointmentToRichResponse(
			&appointment,
			clientByID[appointment.ClientID],
			professionalByID[appointment.ProfessionalID],
			servicoByID,
		)
	}

	return result, nil
}

func mapAppointmentToRichResponse(
	appointment *models.Appointment,
	cliente models.Cliente,
	profissional models.Profissional,
	servicoByID map[int]models.Servico,
) dtos.AppointmentResponse {
	serviceIDs := extractServiceIDs(appointment.Services)
	services := make([]dtos.AppointmentServiceItem, 0, len(serviceIDs))

	for _, serviceID := range serviceIDs {
		servico, ok := servicoByID[serviceID]
		if !ok {
			continue
		}
		services = append(services, dtos.AppointmentServiceItem{
			ID:              servico.ID,
			Name:            servico.Nome,
			DurationMinutes: servico.Duracao,
		})
	}

	return dtos.AppointmentResponse{
		ID:               appointment.ID,
		ClientID:         appointment.ClientID,
		ClientName:       cliente.Nome,
		ProfessionalID:   appointment.ProfessionalID,
		ProfessionalName: profissional.Nome,
		ServiceIDs:       serviceIDs,
		Services:         services,
		Date:             appointment.Date,
		StartTime:        appointment.StartTime,
		EndTime:          appointment.EndTime,
		Status:           models.NormalizeAppointmentStatus(appointment.Status),
	}
}
