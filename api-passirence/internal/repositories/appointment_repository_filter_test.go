package repositories

import (
	"api-passirence/internal/models"
	"testing"
)

func TestFilterScheduleBlockingAppointments_viaModels(t *testing.T) {
	appointments := []models.Appointment{
		{ID: 1, Status: "cancelled"},
		{ID: 2, Status: "CANCELED"},
		{ID: 3, Status: "scheduled"},
		{ID: 4, Status: "finished"},
		{ID: 5, Status: "cancelado"},
	}

	filtered := models.FilterScheduleBlockingAppointments(appointments)
	if len(filtered) != 1 || filtered[0].ID != 3 {
		t.Fatalf("unexpected filter result: %+v", filtered)
	}
}
