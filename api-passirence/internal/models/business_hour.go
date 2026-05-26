package models

import "time"

type BusinessHour struct {
	ID                   int       `gorm:"primaryKey;autoIncrement" json:"id"`
	BarberShopSettingsID int       `gorm:"not null;index" json:"-"`
	WeekDay              int       `gorm:"not null" json:"weekday"`
	OpenTime             string    `gorm:"type:varchar(5)" json:"openTime"`
	CloseTime            string    `gorm:"type:varchar(5)" json:"closeTime"`
	IsOpen               bool      `gorm:"not null;default:false" json:"isOpen"`
	CreatedAt            time.Time `json:"createdAt"`
	UpdatedAt            time.Time `json:"updatedAt"`
}

func (BusinessHour) TableName() string {
	return "business_hours"
}
