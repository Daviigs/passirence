package schedule

import (
	"testing"
	"time"
)

func TestFilterPastSlotsForToday_removesPastSlots(t *testing.T) {
	loc := mustLocation(t, "America/Sao_Paulo")
	date := "2026-05-27"
	now := time.Date(2026, 5, 27, 14, 20, 0, 0, loc)

	slots := []string{"13:00", "13:30", "14:00", "14:30", "15:00"}
	got := FilterPastSlotsForToday(date, loc, slots, now)

	want := []string{"14:30", "15:00"}
	assertStringSliceEqual(t, got, want)
}

func TestFilterPastSlotsForToday_keepsSlotEqualToCurrentTime(t *testing.T) {
	loc := mustLocation(t, "America/Sao_Paulo")
	date := "2026-05-27"
	now := time.Date(2026, 5, 27, 14, 0, 0, 0, loc)

	slots := []string{"13:30", "14:00", "14:30"}
	got := FilterPastSlotsForToday(date, loc, slots, now)

	want := []string{"14:00", "14:30"}
	assertStringSliceEqual(t, got, want)
}

func TestFilterPastSlotsForToday_futureDateUnchanged(t *testing.T) {
	loc := mustLocation(t, "America/Sao_Paulo")
	date := "2026-05-28"
	now := time.Date(2026, 5, 27, 14, 20, 0, 0, loc)

	slots := []string{"08:00", "08:30", "09:00"}
	got := FilterPastSlotsForToday(date, loc, slots, now)

	assertStringSliceEqual(t, got, slots)
}

func TestFilterPastSlotsForToday_timezoneDiffFromServerUTC(t *testing.T) {
	loc := mustLocation(t, "America/Sao_Paulo")
	date := "2026-05-27"
	// 17:20 UTC = 14:20 in São Paulo (UTC-3, no DST in May)
	now := time.Date(2026, 5, 27, 17, 20, 0, 0, time.UTC)

	slots := []string{"13:00", "14:00", "14:30", "15:00"}
	got := FilterPastSlotsForToday(date, loc, slots, now)

	want := []string{"14:30", "15:00"}
	assertStringSliceEqual(t, got, want)
}

func TestFilterPastSlotsForToday_dynamicSlotAfterPartialBooking(t *testing.T) {
	loc := mustLocation(t, "America/Sao_Paulo")
	date := "2026-05-27"
	now := time.Date(2026, 5, 27, 9, 31, 0, 0, loc)

	slots := []string{"09:00", "09:30", "09:40", "10:00"}
	got := FilterPastSlotsForToday(date, loc, slots, now)

	want := []string{"09:40", "10:00"}
	assertStringSliceEqual(t, got, want)
}

func TestFilterPastSlotsForToday_dayBoundaryInTimezone(t *testing.T) {
	loc := mustLocation(t, "America/Sao_Paulo")
	// 02:30 UTC on May 28 = 23:30 on May 27 in São Paulo
	now := time.Date(2026, 5, 28, 2, 30, 0, 0, time.UTC)

	slots := []string{"22:00", "23:00", "23:30"}
	got := FilterPastSlotsForToday("2026-05-27", loc, slots, now)

	want := []string{"23:30"}
	assertStringSliceEqual(t, got, want)
}

func TestFilterPastSlotsForToday_emptyInput(t *testing.T) {
	loc := mustLocation(t, "America/Sao_Paulo")
	now := time.Date(2026, 5, 27, 14, 0, 0, 0, loc)

	got := FilterPastSlotsForToday("2026-05-27", loc, nil, now)
	if got != nil {
		t.Fatalf("expected nil, got %v", got)
	}
}

func mustLocation(t *testing.T, name string) *time.Location {
	t.Helper()
	loc, err := time.LoadLocation(name)
	if err != nil {
		t.Fatalf("load location: %v", err)
	}
	return loc
}

func assertStringSliceEqual(t *testing.T, got, want []string) {
	t.Helper()
	if len(got) != len(want) {
		t.Fatalf("len mismatch: got %v want %v", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("index %d: got %q want %q (full got=%v)", i, got[i], want[i], got)
		}
	}
}
