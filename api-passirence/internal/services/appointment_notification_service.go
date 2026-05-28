package services

import (
	"context"
	"log"
	"strings"
	"time"

	"api-passirence/internal/dtos"
	"api-passirence/internal/integrations/whatsapp"
	"api-passirence/internal/phone"
	"api-passirence/internal/repositories"
)

// AppointmentNotificationService notifies clients via the WhatsApp API (fire-and-forget safe).
type AppointmentNotificationService struct {
	whatsapp *whatsapp.Client
}

func NewAppointmentNotificationService(client *whatsapp.Client) *AppointmentNotificationService {
	return &AppointmentNotificationService{whatsapp: client}
}

// NotifyAppointmentConfirmation sends a confirmation message without affecting the caller on failure.
func (s *AppointmentNotificationService) NotifyAppointmentConfirmation(
	ctx context.Context,
	appointment *dtos.AppointmentResponse,
	serviceIDs []int,
) {
	if !s.canNotify(appointment) {
		return
	}

	base, telefone, ok := s.buildBasePayload(ctx, appointment, serviceIDs)
	if !ok {
		return
	}

	payload := whatsapp.AppointmentConfirmationRequest{
		Phone:      base.Phone,
		ClientName: base.ClientName,
		Service:    base.Service,
		Date:       base.Date,
		Time:       base.Time,
		TotalPrice: base.TotalPrice,
	}

	if err := s.whatsapp.SendAppointmentConfirmation(ctx, payload); err != nil {
		log.Printf(
			"whatsapp: falha ao enviar confirmação do agendamento %d para %s: %v",
			appointment.ID,
			telefone,
			err,
		)
		return
	}

	log.Printf(
		"whatsapp: confirmação solicitada para agendamento %d (telefone %s)",
		appointment.ID,
		telefone,
	)
}

// NotifyAppointmentCancellation sends a cancellation message without affecting the caller on failure.
func (s *AppointmentNotificationService) NotifyAppointmentCancellation(
	ctx context.Context,
	appointment *dtos.AppointmentResponse,
	serviceIDs []int,
) {
	if !s.canNotify(appointment) {
		return
	}

	base, telefone, ok := s.buildBasePayload(ctx, appointment, serviceIDs)
	if !ok {
		return
	}

	payload := whatsapp.AppointmentCancelRequest{
		Phone:      base.Phone,
		ClientName: base.ClientName,
		Service:    base.Service,
		Date:       base.Date,
		Time:       base.Time,
	}

	if err := s.whatsapp.SendAppointmentCancel(ctx, payload); err != nil {
		log.Printf(
			"whatsapp: falha ao enviar cancelamento do agendamento %d para %s: %v",
			appointment.ID,
			telefone,
			err,
		)
		return
	}

	log.Printf(
		"whatsapp: cancelamento solicitado para agendamento %d (telefone %s)",
		appointment.ID,
		telefone,
	)
}

func (s *AppointmentNotificationService) canNotify(appointment *dtos.AppointmentResponse) bool {
	if s.whatsapp == nil || !s.whatsapp.Enabled() {
		return false
	}
	return appointment != nil
}

type appointmentNotifyPayload struct {
	Phone      string
	ClientName string
	Service    string
	Date       string
	Time       string
	TotalPrice float64
}

func (s *AppointmentNotificationService) buildBasePayload(
	ctx context.Context,
	appointment *dtos.AppointmentResponse,
	serviceIDs []int,
) (appointmentNotifyPayload, string, bool) {
	cliente, err := repositories.GetClienteByID(ctx, appointment.ClientID)
	if err != nil {
		log.Printf(
			"whatsapp: falha ao buscar cliente %d para agendamento %d: %v",
			appointment.ClientID,
			appointment.ID,
			err,
		)
		return appointmentNotifyPayload{}, "", false
	}

	telefone := phone.Normalize(cliente.Telefone)
	if telefone == "" {
		log.Printf(
			"whatsapp: cliente %d sem telefone válido, notificação não enviada (agendamento %d)",
			appointment.ClientID,
			appointment.ID,
		)
		return appointmentNotifyPayload{}, "", false
	}

	serviceLabel, totalPrice, err := s.resolveServices(ctx, serviceIDs, appointment.Services)
	if err != nil {
		log.Printf(
			"whatsapp: falha ao resolver serviços do agendamento %d: %v",
			appointment.ID,
			err,
		)
		return appointmentNotifyPayload{}, "", false
	}

	return appointmentNotifyPayload{
		Phone:      telefone,
		ClientName: appointment.ClientName,
		Service:    serviceLabel,
		Date:       formatDateBR(appointment.Date),
		Time:       formatTimeHHMM(appointment.StartTime),
		TotalPrice: totalPrice,
	}, telefone, true
}

func (s *AppointmentNotificationService) resolveServices(
	ctx context.Context,
	serviceIDs []int,
	fallback []dtos.AppointmentServiceItem,
) (label string, totalPrice float64, err error) {
	if len(serviceIDs) == 0 {
		return joinServiceNames(fallback), 0, nil
	}

	servicos, err := repositories.GetServicosByIDs(ctx, serviceIDs)
	if err != nil {
		return "", 0, err
	}

	if len(servicos) == 0 {
		return joinServiceNames(fallback), 0, nil
	}

	names := make([]string, 0, len(servicos))
	for _, servico := range servicos {
		names = append(names, servico.Nome)
		totalPrice += servico.Preco
	}

	return strings.Join(names, ", "), totalPrice, nil
}

func joinServiceNames(services []dtos.AppointmentServiceItem) string {
	if len(services) == 0 {
		return "Serviço"
	}
	names := make([]string, 0, len(services))
	for _, item := range services {
		if item.Name != "" {
			names = append(names, item.Name)
		}
	}
	if len(names) == 0 {
		return "Serviço"
	}
	return strings.Join(names, ", ")
}

func formatDateBR(isoDate string) string {
	parsed, err := time.Parse("2006-01-02", isoDate)
	if err != nil {
		return isoDate
	}
	return parsed.Format("02/01/2006")
}

func formatTimeHHMM(raw string) string {
	raw = strings.TrimSpace(raw)
	if len(raw) >= 5 {
		return raw[:5]
	}
	return raw
}
