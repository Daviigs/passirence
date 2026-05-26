package models

import "time"

const (
	BlockTypeDayOff       = "DAY_OFF"
	BlockTypeCustomBlock  = "CUSTOM_BLOCK"
	BlockTypeLunch        = "LUNCH"
	BlockTypeBreak        = "BREAK"
	BlockTypeVacation     = "VACATION"
	BlockTypeHoliday      = "HOLIDAY"
)

type ScheduleBlock struct {
	ID             int       `gorm:"primaryKey;autoIncrement" json:"id"`
	ProfessionalID *int      `gorm:"index" json:"professionalId,omitempty"`
	Type           string    `gorm:"type:varchar(32);not null" json:"type"`
	IsRecurring    bool      `gorm:"not null;default:false" json:"isRecurring"`
	WeekDay        *int      `json:"weekday,omitempty"`
	Date           *string   `gorm:"type:varchar(10);index" json:"date,omitempty"`
	StartTime      string    `gorm:"type:varchar(5);not null" json:"startTime"`
	EndTime        string    `gorm:"type:varchar(5);not null" json:"endTime"`
	Reason         string    `gorm:"type:varchar(255)" json:"reason"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}

func (ScheduleBlock) TableName() string {
	return "schedule_blocks"
}
