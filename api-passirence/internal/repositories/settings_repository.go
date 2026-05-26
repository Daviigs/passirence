package repositories

import (
	"api-passirence/internal/database"
	"api-passirence/internal/models"
	"context"
	"errors"

	"gorm.io/gorm"
)

func GetSettings(ctx context.Context) (*models.BarberShopSettings, error) {
	var settings models.BarberShopSettings

	err := database.DB.WithContext(ctx).
		Preload("BusinessHours").
		First(&settings).Error

	if err != nil {
		return nil, err
	}

	return &settings, nil
}

func UpdateSettingsWithHours(
	ctx context.Context,
	settings *models.BarberShopSettings,
	hours []models.BusinessHour,
) error {
	return database.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if settings.ID == 0 {
			if err := tx.Create(settings).Error; err != nil {
				return err
			}
		} else if err := tx.Save(settings).Error; err != nil {
			return err
		}

		if err := tx.Where("barber_shop_settings_id = ?", settings.ID).
			Delete(&models.BusinessHour{}).Error; err != nil {
			return err
		}

		if len(hours) == 0 {
			return nil
		}

		for i := range hours {
			hours[i].BarberShopSettingsID = settings.ID
			hours[i].ID = 0
		}

		return tx.Create(&hours).Error
	})
}

func IsRecordNotFound(err error) bool {
	return errors.Is(err, gorm.ErrRecordNotFound)
}
