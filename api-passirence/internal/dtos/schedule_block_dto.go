package dtos

type CreateScheduleBlockRequest struct {
	ProfessionalID *int   `json:"professionalId"`
	Type           string `json:"type"`
	IsRecurring    bool   `json:"isRecurring"`
	WeekDay        *int   `json:"weekday"`
	Date           *string `json:"date"`
	StartTime      string `json:"startTime"`
	EndTime        string `json:"endTime"`
	Reason         string `json:"reason"`
}

type UpdateScheduleBlockRequest struct {
	ProfessionalID *int   `json:"professionalId"`
	Type           string `json:"type"`
	IsRecurring    bool   `json:"isRecurring"`
	WeekDay        *int   `json:"weekday"`
	Date           *string `json:"date"`
	StartTime      string `json:"startTime"`
	EndTime        string `json:"endTime"`
	Reason         string `json:"reason"`
}

type ScheduleBlockResponse struct {
	ID             int    `json:"id"`
	ProfessionalID *int   `json:"professionalId,omitempty"`
	Type           string `json:"type"`
	IsRecurring    bool   `json:"isRecurring"`
	WeekDay        *int   `json:"weekday,omitempty"`
	Date           *string `json:"date,omitempty"`
	StartTime      string `json:"startTime"`
	EndTime        string `json:"endTime"`
	Reason         string `json:"reason"`
}

type ScheduleBlockListFilter struct {
	ProfessionalID *int
	Date           string
	IsRecurring    *bool
	Type           string
}
