package dtos

type BusinessHourInput struct {
	WeekDay   int    `json:"weekday"`
	OpenTime  string `json:"openTime"`
	CloseTime string `json:"closeTime"`
	IsOpen    bool   `json:"isOpen"`
}

type UpdateSettingsRequest struct {
	Timezone        string              `json:"timezone"`
	SlotInterval    int                 `json:"slotInterval"`
	ReminderMinutes int                 `json:"reminderMinutes"`
	BusinessHours   []BusinessHourInput `json:"businessHours"`
}

type BusinessHourResponse struct {
	WeekDay   int    `json:"weekday"`
	OpenTime  string `json:"openTime,omitempty"`
	CloseTime string `json:"closeTime,omitempty"`
	IsOpen    bool   `json:"isOpen"`
}

type SettingsResponse struct {
	Timezone        string                 `json:"timezone"`
	SlotInterval    int                    `json:"slotInterval"`
	ReminderMinutes int                    `json:"reminderMinutes"`
	BusinessHours   []BusinessHourResponse `json:"businessHours"`
}
