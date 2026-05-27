package models

import (
	"strings"
	"time"
)

// Status oficiais de agendamento (única fonte de verdade).
const (
	AppointmentStatusScheduled  = "scheduled"
	AppointmentStatusCompleted  = "completed"
	AppointmentStatusCancelled  = "cancelled"
)

// OfficialAppointmentStatuses lista os status válidos na API.
func OfficialAppointmentStatuses() []string {
	return []string{
		AppointmentStatusScheduled,
		AppointmentStatusCompleted,
		AppointmentStatusCancelled,
	}
}

// NormalizeAppointmentStatus converte status legados para um dos 3 oficiais.
func NormalizeAppointmentStatus(status string) string {
	switch strings.ToLower(strings.TrimSpace(status)) {
	case AppointmentStatusScheduled,
		"confirmed",
		"in_progress",
		"in-progress",
		"pending",
		"agendado",
		"confirmado",
		"em_andamento",
		"em andamento":
		return AppointmentStatusScheduled
	case AppointmentStatusCompleted,
		"finished",
		"finalizado",
		"concluido",
		"concluído":
		return AppointmentStatusCompleted
	case AppointmentStatusCancelled,
		"canceled",
		"cancelado",
		"no_show",
		"no-show",
		"nao_compareceu",
		"não_compareceu":
		return AppointmentStatusCancelled
	default:
		return AppointmentStatusScheduled
	}
}

// AppointmentBlocksSchedule indica se o agendamento ocupa horário na agenda.
func AppointmentBlocksSchedule(status string) bool {
	return NormalizeAppointmentStatus(status) == AppointmentStatusScheduled
}

// FilterScheduleBlockingAppointments retorna apenas agendamentos que ocupam horário na agenda.
func FilterScheduleBlockingAppointments(appointments []Appointment) []Appointment {
	if len(appointments) == 0 {
		return appointments
	}
	filtered := make([]Appointment, 0, len(appointments))
	for _, appointment := range appointments {
		if AppointmentBlocksSchedule(appointment.Status) {
			filtered = append(filtered, appointment)
		}
	}
	return filtered
}

type Appointment struct {
	ID             int       `gorm:"primaryKey;autoIncrement" json:"id"`
	ClientID       int       `gorm:"not null;index" json:"clientId"`
	ProfessionalID int       `gorm:"not null;index;index:idx_appointments_date_professional,priority:2" json:"professionalId"`
	Date           string    `gorm:"type:varchar(10);not null;index;index:idx_appointments_date_professional,priority:1" json:"date"`
	StartTime      string    `gorm:"type:varchar(5);not null" json:"startTime"`
	EndTime        string    `gorm:"type:varchar(5);not null" json:"endTime"`
	Status         string    `gorm:"type:varchar(20);not null;default:scheduled;index" json:"status"`
	ReminderSent   bool      `gorm:"not null;default:false" json:"reminderSent"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
	Services       []AppointmentService `gorm:"foreignKey:AppointmentID;constraint:OnDelete:CASCADE" json:"services,omitempty"`
}

func (Appointment) TableName() string {
	return "appointments"
}

func IsValidAppointmentStatus(status string) bool {
	normalized := NormalizeAppointmentStatus(status)
	return normalized == AppointmentStatusScheduled ||
		normalized == AppointmentStatusCompleted ||
		normalized == AppointmentStatusCancelled
}

// IsActiveAppointmentStatus — agendamento ainda editável (apenas scheduled).
func IsActiveAppointmentStatus(status string) bool {
	return NormalizeAppointmentStatus(status) == AppointmentStatusScheduled
}

// CanTransitionStatus valida mudanças de status entre os 3 oficiais.
func CanTransitionStatus(current, next string) bool {
	current = NormalizeAppointmentStatus(current)
	next = NormalizeAppointmentStatus(next)

	if current == next {
		return true
	}

	if current == AppointmentStatusScheduled {
		return next == AppointmentStatusCompleted || next == AppointmentStatusCancelled
	}

	return false
}
