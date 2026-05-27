package models

import (
	"strings"
	"time"
)

const (
	AppointmentStatusScheduled  = "scheduled"
	AppointmentStatusConfirmed  = "confirmed"
	AppointmentStatusInProgress = "in_progress"
	AppointmentStatusFinished   = "finished"
	AppointmentStatusCompleted  = "completed"
	AppointmentStatusCancelled  = "cancelled"
	AppointmentStatusCanceled   = "canceled"
	AppointmentStatusNoShow     = "no_show"
)

// ActiveAppointmentStatuses — agendamentos que ainda podem ser editados (não encerrados).
var ActiveAppointmentStatuses = []string{
	AppointmentStatusScheduled,
	AppointmentStatusConfirmed,
}

// ScheduleNonBlockingStatuses — status que liberam o horário na agenda (referência/documentação).
func ScheduleNonBlockingStatuses() []string {
	return []string{
		AppointmentStatusCancelled,
		AppointmentStatusCanceled,
		"cancelado",
		AppointmentStatusFinished,
		AppointmentStatusCompleted,
		"finalizado",
		"concluido",
		"concluído",
		AppointmentStatusNoShow,
		"no-show",
		"nao_compareceu",
		"não_compareceu",
	}
}

// AppointmentBlocksSchedule indica se o agendamento ocupa horário na disponibilidade e validação de conflito.
func AppointmentBlocksSchedule(status string) bool {
	switch normalizeAppointmentStatus(status) {
	case AppointmentStatusScheduled,
		AppointmentStatusConfirmed,
		AppointmentStatusInProgress,
		"in-progress",
		"pending",
		"agendado",
		"confirmado",
		"em_andamento",
		"em andamento":
		return true
	case AppointmentStatusCancelled,
		AppointmentStatusCanceled,
		"cancelado",
		AppointmentStatusFinished,
		AppointmentStatusCompleted,
		"finalizado",
		"concluido",
		"concluído",
		AppointmentStatusNoShow,
		"no-show",
		"nao_compareceu",
		"não_compareceu":
		return false
	default:
		return false
	}
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

func normalizeAppointmentStatus(status string) string {
	return strings.ToLower(strings.TrimSpace(status))
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
	switch normalizeAppointmentStatus(status) {
	case AppointmentStatusScheduled,
		AppointmentStatusConfirmed,
		AppointmentStatusInProgress,
		"in-progress",
		AppointmentStatusFinished,
		AppointmentStatusCompleted,
		AppointmentStatusCancelled,
		AppointmentStatusCanceled,
		AppointmentStatusNoShow,
		"no-show":
		return true
	default:
		return false
	}
}

func IsActiveAppointmentStatus(status string) bool {
	return status == AppointmentStatusScheduled || status == AppointmentStatusConfirmed
}
