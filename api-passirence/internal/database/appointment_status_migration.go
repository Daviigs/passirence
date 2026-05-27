package database

import (
	"api-passirence/internal/models"
	"log"

	"gorm.io/gorm"
)

// migrateAppointmentStatuses normaliza status legados para scheduled | completed | cancelled.
func migrateAppointmentStatuses(db *gorm.DB) error {
	legacyToOfficial := map[string]string{
		"confirmed":    models.AppointmentStatusScheduled,
		"in_progress":  models.AppointmentStatusScheduled,
		"in-progress":  models.AppointmentStatusScheduled,
		"pending":      models.AppointmentStatusScheduled,
		"agendado":     models.AppointmentStatusScheduled,
		"confirmado":   models.AppointmentStatusScheduled,
		"finished":     models.AppointmentStatusCompleted,
		"finalizado":   models.AppointmentStatusCompleted,
		"concluido":    models.AppointmentStatusCompleted,
		"canceled":     models.AppointmentStatusCancelled,
		"cancelado":    models.AppointmentStatusCancelled,
		"no_show":      models.AppointmentStatusCancelled,
		"no-show":      models.AppointmentStatusCancelled,
	}

	for from, to := range legacyToOfficial {
		result := db.Model(&models.Appointment{}).Where("LOWER(TRIM(status)) = ?", from).Update("status", to)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected > 0 {
			log.Printf("appointments: migrados %d registros de status %q -> %q", result.RowsAffected, from, to)
		}
	}

	return nil
}
