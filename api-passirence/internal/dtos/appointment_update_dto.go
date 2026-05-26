package dtos

type UpdateAppointmentRequest struct {
	ProfessionalID int    `json:"professionalId"`
	ServiceIDs     []int  `json:"serviceIds"`
	Date           string `json:"date"`
	StartTime      string `json:"startTime"`
	Status         string `json:"status"`
}
