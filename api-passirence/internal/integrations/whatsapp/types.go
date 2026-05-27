package whatsapp

// AppointmentConfirmationRequest is the payload sent to POST /messages/appointment/confirmation.
type AppointmentConfirmationRequest struct {
	Phone      string  `json:"phone"`
	ClientName string  `json:"clientName"`
	Service    string  `json:"service"`
	Date       string  `json:"date"`
	Time       string  `json:"time"`
	TotalPrice float64 `json:"totalPrice"`
}

type apiSuccessResponse struct {
	Success bool `json:"success"`
}

type apiErrorResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error"`
}
