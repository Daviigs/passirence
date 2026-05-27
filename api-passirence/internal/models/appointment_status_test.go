package models

import "testing"

func TestNormalizeAppointmentStatus_legacy(t *testing.T) {
	cases := map[string]string{
		"confirmed":    AppointmentStatusScheduled,
		"in_progress":  AppointmentStatusScheduled,
		"pending":      AppointmentStatusScheduled,
		"finished":     AppointmentStatusCompleted,
		"canceled":     AppointmentStatusCancelled,
		"cancelado":    AppointmentStatusCancelled,
		"scheduled":    AppointmentStatusScheduled,
		"completed":    AppointmentStatusCompleted,
		"cancelled":    AppointmentStatusCancelled,
	}

	for input, want := range cases {
		if got := NormalizeAppointmentStatus(input); got != want {
			t.Fatalf("NormalizeAppointmentStatus(%q) = %q, want %q", input, got, want)
		}
	}
}

func TestAppointmentBlocksSchedule(t *testing.T) {
	if !AppointmentBlocksSchedule("scheduled") {
		t.Fatal("scheduled must block")
	}
	if !AppointmentBlocksSchedule("confirmed") {
		t.Fatal("legacy confirmed must block as scheduled")
	}
	for _, status := range []string{"cancelled", "canceled", "completed", "finished", "no_show"} {
		if AppointmentBlocksSchedule(status) {
			t.Fatalf("%q must not block", status)
		}
	}
}

func TestFilterScheduleBlockingAppointments(t *testing.T) {
	input := []Appointment{
		{ID: 1, Status: "cancelled"},
		{ID: 2, Status: "scheduled"},
		{ID: 3, Status: "confirmed"},
		{ID: 4, Status: "completed"},
	}
	filtered := FilterScheduleBlockingAppointments(input)
	if len(filtered) != 2 {
		t.Fatalf("expected 2 blocking, got %d", len(filtered))
	}
}

func TestCanTransitionStatus(t *testing.T) {
	if !CanTransitionStatus("scheduled", "completed") {
		t.Fatal("scheduled -> completed")
	}
	if !CanTransitionStatus("scheduled", "cancelled") {
		t.Fatal("scheduled -> cancelled")
	}
	if CanTransitionStatus("completed", "scheduled") {
		t.Fatal("completed -> scheduled not allowed")
	}
	if CanTransitionStatus("cancelled", "scheduled") {
		t.Fatal("cancelled -> scheduled not allowed")
	}
}
