package models

import "testing"

func TestAppointmentBlocksSchedule(t *testing.T) {
	blocking := []string{
		"scheduled",
		"confirmed",
		"in_progress",
		"in-progress",
		"pending",
		" Scheduled ",
	}
	for _, status := range blocking {
		if !AppointmentBlocksSchedule(status) {
			t.Fatalf("expected %q to block schedule", status)
		}
	}

	nonBlocking := []string{
		"cancelled",
		"canceled",
		"finished",
		"completed",
		"no_show",
		"no-show",
		" Cancelled ",
		"",
		"unknown",
	}
	for _, status := range nonBlocking {
		if AppointmentBlocksSchedule(status) {
			t.Fatalf("expected %q to NOT block schedule", status)
		}
	}
}

func TestFilterScheduleBlockingAppointments(t *testing.T) {
	input := []Appointment{
		{ID: 1, Status: "cancelled", StartTime: "14:00", EndTime: "15:00"},
		{ID: 2, Status: "scheduled", StartTime: "16:00", EndTime: "17:00"},
		{ID: 3, Status: "cancelado", StartTime: "10:00", EndTime: "11:00"},
		{ID: 4, Status: "finished", StartTime: "11:00", EndTime: "12:00"},
	}

	filtered := FilterScheduleBlockingAppointments(input)
	if len(filtered) != 1 {
		t.Fatalf("expected 1 blocking appointment, got %d", len(filtered))
	}
	if filtered[0].ID != 2 {
		t.Fatalf("expected id 2, got %d", filtered[0].ID)
	}
}
