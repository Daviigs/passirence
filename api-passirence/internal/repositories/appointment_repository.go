package repositories

import (
	"api-passirence/internal/database"
	"api-passirence/internal/dtos"
	"api-passirence/internal/models"
	"context"

	"gorm.io/gorm"
)

func ListAppointments(ctx context.Context, filters dtos.AppointmentFilters) ([]models.Appointment, error) {
	var appointments []models.Appointment

	query := database.DB.WithContext(ctx).Preload("Services")

	if filters.Date != "" {
		query = query.Where("date = ?", filters.Date)
	}
	if filters.ProfessionalID > 0 {
		query = query.Where("professional_id = ?", filters.ProfessionalID)
	}
	if filters.ClientID > 0 {
		query = query.Where("client_id = ?", filters.ClientID)
	}
	if filters.Status != "" {
		query = query.Where("status = ?", filters.Status)
	}

	err := query.
		Order("date ASC, start_time ASC").
		Find(&appointments).Error

	return appointments, err
}

func GetBlockingAppointmentsByProfessionalAndDate(
	ctx context.Context,
	professionalID int,
	date string,
	excludeAppointmentID int,
) ([]models.Appointment, error) {
	var appointments []models.Appointment

	query := database.DB.WithContext(ctx).
		Where(
			"professional_id = ? AND date = ? AND status IN ?",
			professionalID,
			date,
			models.ActiveAppointmentStatuses,
		)

	if excludeAppointmentID > 0 {
		query = query.Where("id <> ?", excludeAppointmentID)
	}

	err := query.Find(&appointments).Error
	return appointments, err
}

func CreateAppointmentWithServices(
	ctx context.Context,
	appointment *models.Appointment,
	serviceIDs []int,
) error {
	return database.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(appointment).Error; err != nil {
			return err
		}

		links := make([]models.AppointmentService, len(serviceIDs))
		for i, serviceID := range serviceIDs {
			links[i] = models.AppointmentService{
				AppointmentID: appointment.ID,
				ServiceID:     serviceID,
			}
		}

		return tx.Create(&links).Error
	})
}

func UpdateAppointmentWithServices(
	ctx context.Context,
	appointment *models.Appointment,
	serviceIDs []int,
) error {
	return database.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(appointment).Error; err != nil {
			return err
		}

		if err := tx.Where("appointment_id = ?", appointment.ID).
			Delete(&models.AppointmentService{}).Error; err != nil {
			return err
		}

		if len(serviceIDs) == 0 {
			return nil
		}

		links := make([]models.AppointmentService, len(serviceIDs))
		for i, serviceID := range serviceIDs {
			links[i] = models.AppointmentService{
				AppointmentID: appointment.ID,
				ServiceID:     serviceID,
			}
		}

		return tx.Create(&links).Error
	})
}

func GetAppointmentByID(ctx context.Context, id int) (*models.Appointment, error) {
	var appointment models.Appointment

	err := database.DB.WithContext(ctx).
		Preload("Services").
		First(&appointment, id).Error

	if err != nil {
		return nil, err
	}

	return &appointment, nil
}

func UpdateAppointmentStatus(ctx context.Context, id int, status string) error {
	return database.DB.WithContext(ctx).
		Model(&models.Appointment{}).
		Where("id = ?", id).
		Update("status", status).Error
}
