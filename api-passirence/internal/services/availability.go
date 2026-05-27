package services

import (
	"api-passirence/internal/apperror"
	"api-passirence/internal/models"
	"api-passirence/internal/repositories"
	"api-passirence/internal/schedule"
	"context"
)

func fetchBusyRanges(
	ctx context.Context,
	professionalID int,
	date string,
	weekday int,
	excludeAppointmentID int,
) ([]schedule.TimeRange, error) {
	appointments, err := repositories.GetBlockingAppointmentsByProfessionalAndDate(
		ctx,
		professionalID,
		date,
		excludeAppointmentID,
	)
	if err != nil {
		return nil, apperror.Internal("falha ao buscar agendamentos do profissional")
	}

	busy, err := appointmentBusyRanges(appointments)
	if err != nil {
		return nil, err
	}

	blocks, err := repositories.GetBlocksForAvailability(ctx, professionalID, date, weekday)
	if err != nil {
		return nil, apperror.Internal("falha ao buscar bloqueios de agenda")
	}

	blockRanges, err := schedule.BlocksToTimeRanges(blocks)
	if err != nil {
		return nil, apperror.Internal("bloqueio com horário inválido")
	}

	return append(busy, blockRanges...), nil
}

func isDateGloballyBlocked(ctx context.Context, date string, weekday int) (bool, error) {
	blocks, err := repositories.GetGlobalBlocksForDate(ctx, date, weekday)
	if err != nil {
		return false, apperror.Internal("falha ao buscar bloqueios globais")
	}
	return schedule.IsDateFullyBlocked(blocks), nil
}

func appointmentBusyRanges(appointments []models.Appointment) ([]schedule.TimeRange, error) {
	busy := make([]schedule.TimeRange, 0, len(appointments))
	for _, appointment := range appointments {
		if !models.AppointmentBlocksSchedule(appointment.Status) {
			continue
		}
		timeRange, err := schedule.ToTimeRanges(appointment.StartTime, appointment.EndTime)
		if err != nil {
			return nil, apperror.Internal("agendamento existente com horário inválido")
		}
		busy = append(busy, timeRange)
	}
	return busy, nil
}
