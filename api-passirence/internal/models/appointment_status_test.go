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
	if !CanTransitionStatus("scheduled", "scheduled") {
		t.Fatal("same status should be allowed")
	}
	if CanTransitionStatus("completed", "cancelled") {
		t.Fatal("completed -> cancelled not allowed")
	}
}

func TestNormalizeAppointmentStatus_defaultAndWhitespace(t *testing.T) {
	if got := NormalizeAppointmentStatus("  "); got != AppointmentStatusScheduled {
		t.Fatalf("empty/whitespace should default to scheduled, got %q", got)
	}
	if got := NormalizeAppointmentStatus("unknown"); got != AppointmentStatusScheduled {
		t.Fatalf("unknown status should default to scheduled, got %q", got)
	}
	if got := NormalizeAppointmentStatus("FINALIZADO"); got != AppointmentStatusCompleted {
		t.Fatalf("case insensitive legacy, got %q", got)
	}
}

func TestIsValidAppointmentStatus(t *testing.T) {
	for _, status := range []string{"scheduled", "completed", "cancelled", "confirmed", "finished"} {
		if !IsValidAppointmentStatus(status) {
			t.Fatalf("%q should be valid", status)
		}
	}
}

func TestIsActiveAppointmentStatus(t *testing.T) {
	if !IsActiveAppointmentStatus("scheduled") {
		t.Fatal("scheduled is active")
	}
	if IsActiveAppointmentStatus("completed") {
		t.Fatal("completed is not active")
	}
	if !IsActiveAppointmentStatus("confirmed") {
		t.Fatal("legacy confirmed maps to active scheduled")
	}
}

func TestFilterScheduleBlockingAppointments_empty(t *testing.T) {
	if got := FilterScheduleBlockingAppointments(nil); got != nil {
		t.Fatalf("nil input should return nil, got %v", got)
	}
	if len(FilterScheduleBlockingAppointments([]Appointment{})) != 0 {
		t.Fatal("empty slice should return empty slice")
	}
}

func TestOfficialAppointmentStatuses(t *testing.T) {
	statuses := OfficialAppointmentStatuses()
	if len(statuses) != 3 {
		t.Fatalf("expected 3 official statuses, got %d", len(statuses))
	}
}
