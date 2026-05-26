package dtos

type AppointmentFilters struct {
	Date           string
	ProfessionalID int
	ClientID       int
	Status         string
}

type AppointmentServiceItem struct {
	ID              int    `json:"id"`
	Name            string `json:"name"`
	DurationMinutes int    `json:"durationMinutes"`
}

type AppointmentResponse struct {
	ID               int                    `json:"id"`
	ClientID         int                    `json:"clientId"`
	ClientName       string                 `json:"clientName"`
	ProfessionalID   int                    `json:"professionalId"`
	ProfessionalName string                 `json:"professionalName"`
	ServiceIDs       []int                  `json:"serviceIds"`
	Services         []AppointmentServiceItem `json:"services"`
	Date             string                 `json:"date"`
	StartTime        string                 `json:"startTime"`
	EndTime          string                 `json:"endTime"`
	Status           string                 `json:"status"`
}
