package models

import "time"

const (
	AppointmentStatusScheduled = "scheduled"
	AppointmentStatusConfirmed = "confirmed"
	AppointmentStatusFinished  = "finished"
	AppointmentStatusCancelled = "cancelled"
)

var ActiveAppointmentStatuses = []string{
	AppointmentStatusScheduled,
	AppointmentStatusConfirmed,
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
	switch status {
	case AppointmentStatusScheduled,
		AppointmentStatusConfirmed,
		AppointmentStatusFinished,
		AppointmentStatusCancelled:
		return true
	default:
		return false
	}
}

func IsActiveAppointmentStatus(status string) bool {
	return status == AppointmentStatusScheduled || status == AppointmentStatusConfirmed
}
