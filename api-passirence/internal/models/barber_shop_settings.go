package models

type BarberShopSettings struct {
	ID              int            `gorm:"primaryKey;autoIncrement" json:"id"`
	Timezone        string         `gorm:"not null;size:64" json:"timezone"`
	SlotInterval    int            `gorm:"not null" json:"slotInterval"`
	ReminderMinutes int            `gorm:"not null" json:"reminderMinutes"`
	BusinessHours   []BusinessHour `gorm:"foreignKey:BarberShopSettingsID;constraint:OnDelete:CASCADE" json:"businessHours,omitempty"`
}

func (BarberShopSettings) TableName() string {
	return "barber_shop_settings"
}
