package services

import (
	"api-passirence/internal/models"
	"testing"
)

func TestAppointmentBusyRanges_ignoresCancelled(t *testing.T) {
	appointments := []models.Appointment{
		{
			ID:        1,
			StartTime: "14:00",
			EndTime:   "15:00",
			Status:    models.AppointmentStatusCancelled,
		},
		{
			ID:        2,
			StartTime: "16:00",
			EndTime:   "17:00",
			Status:    models.AppointmentStatusScheduled,
		},
	}

	busy, err := appointmentBusyRanges(appointments)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(busy) != 1 {
		t.Fatalf("expected 1 busy range, got %d", len(busy))
	}
	if busy[0].Start != 16*60 || busy[0].End != 17*60 {
		t.Fatalf("unexpected range: %+v", busy[0])
	}
}

func TestAppointmentBusyRanges_ignoresFinishedAndCanceledUS(t *testing.T) {
	appointments := []models.Appointment{
		{StartTime: "09:00", EndTime: "10:00", Status: "finished"},
		{StartTime: "10:00", EndTime: "11:00", Status: "canceled"},
		{StartTime: "11:00", EndTime: "12:00", Status: "no_show"},
	}

	busy, err := appointmentBusyRanges(appointments)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(busy) != 0 {
		t.Fatalf("expected no busy ranges, got %d", len(busy))
	}
}

func TestAppointmentBusyRanges_invalidTime(t *testing.T) {
	appointments := []models.Appointment{
		{StartTime: "invalid", EndTime: "10:00", Status: models.AppointmentStatusScheduled},
	}
	if _, err := appointmentBusyRanges(appointments); err == nil {
		t.Fatal("invalid appointment time should fail")
	}
}

func TestAppointmentBusyRanges_empty(t *testing.T) {
	busy, err := appointmentBusyRanges(nil)
	if err != nil || len(busy) != 0 {
		t.Fatalf("empty appointments should return empty busy, got %v err=%v", busy, err)
	}
}
