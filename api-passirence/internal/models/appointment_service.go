package models

type AppointmentService struct {
	ID            int `gorm:"primaryKey;autoIncrement" json:"id"`
	AppointmentID int `gorm:"not null;index" json:"appointmentId"`
	ServiceID     int `gorm:"not null;index" json:"serviceId"`
}

func (AppointmentService) TableName() string {
	return "appointment_services"
}
