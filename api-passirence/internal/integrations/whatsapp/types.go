package whatsapp

// AppointmentMessageRequest is the base payload for appointment WhatsApp notifications.
type AppointmentMessageRequest struct {
	Phone      string `json:"phone"`
	ClientName string `json:"clientName"`
	Service    string `json:"service"`
	Date       string `json:"date"`
	Time       string `json:"time"`
}

// AppointmentConfirmationRequest is sent to POST /messages/appointment/confirmation.
type AppointmentConfirmationRequest struct {
	Phone      string  `json:"phone"`
	ClientName string  `json:"clientName"`
	Service    string  `json:"service"`
	Date       string  `json:"date"`
	Time       string  `json:"time"`
	TotalPrice float64 `json:"totalPrice"`
}

// AppointmentCancelRequest is sent to POST /messages/appointment/cancel.
type AppointmentCancelRequest = AppointmentMessageRequest

type apiErrorResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error"`
}
