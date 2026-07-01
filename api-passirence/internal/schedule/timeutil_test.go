package schedule

import (
	"testing"
	"time"
)

func TestGenerateGridSlotStarts(t *testing.T) {
	slots := GenerateGridSlotStarts(8*60, 18*60, 60, 30)
	if len(slots) == 0 {
		t.Fatal("expected slots")
	}
	if slots[len(slots)-1] != 17*60 {
		t.Fatalf("expected last slot 17:00, got %s", TimeFromMinutes(slots[len(slots)-1]))
	}
	if slots[0] != 8*60 {
		t.Fatalf("expected first slot 08:00, got %s", TimeFromMinutes(slots[0]))
	}
}

func TestOverlaps(t *testing.T) {
	existing := TimeRange{Start: 14 * 60, End: 15 * 60}

	if !Overlaps(TimeRange{Start: 14 * 60, End: 15 * 60}, existing) {
		t.Fatal("expected overlap at 14:00")
	}
	if !Overlaps(TimeRange{Start: 14*60 + 30, End: 15*60 + 30}, existing) {
		t.Fatal("expected overlap at 14:30")
	}
	if Overlaps(TimeRange{Start: 15 * 60, End: 16 * 60}, existing) {
		t.Fatal("did not expect overlap at 15:00")
	}
}

func TestIsSlotAvailable(t *testing.T) {
	busy := []TimeRange{{Start: 14 * 60, End: 15 * 60}}

	if IsSlotAvailable(14*60, 60, busy) {
		t.Fatal("14:00 should be unavailable")
	}
	if !IsSlotAvailable(15*60, 60, busy) {
		t.Fatal("15:00 should be available")
	}
}

func TestBuildAvailabilityCandidates_afterPartialAppointment(t *testing.T) {
	open := 8 * 60
	close := 18 * 60
	duration := 30
	interval := 30

	busy := []TimeRange{{Start: 9 * 60, End: 9*60 + 40}}

	candidates := BuildAvailabilityCandidates(open, close, duration, interval, busy)
	available := FilterAvailableSlots(candidates, duration, busy)

	assertContains(t, available, "09:40")
	assertContains(t, available, "10:00")
	assertContains(t, available, "10:30")
	assertNotContains(t, available, "09:00")
	assertNotContains(t, available, "09:30")
}

func TestBuildAvailabilityCandidates_multipleAppointments(t *testing.T) {
	open := 8 * 60
	close := 18 * 60
	duration := 30
	interval := 30

	busy := []TimeRange{
		{Start: 8 * 60, End: 8*60 + 50},
		{Start: 9 * 60, End: 9*60 + 40},
	}

	candidates := BuildAvailabilityCandidates(open, close, duration, interval, busy)
	available := FilterAvailableSlots(candidates, duration, busy)

	// 08:50 + 30min termina às 09:20 e conflita com agendamento 09:00–09:40
	assertNotContains(t, available, "08:50")
	assertContains(t, available, "09:40")
	assertContains(t, available, "10:00")
	assertContains(t, available, "10:30")
}

func TestBuildAvailabilityCandidates_releaseAfterBlock(t *testing.T) {
	open := 8 * 60
	close := 18 * 60
	duration := 30
	interval := 30

	busy := []TimeRange{{Start: 13*60 + 15, End: 14*60 + 5}}

	candidates := BuildAvailabilityCandidates(open, close, duration, interval, busy)
	available := FilterAvailableSlots(candidates, duration, busy)

	assertContains(t, available, "14:05")
	assertContains(t, available, "14:30")
	assertNotContains(t, available, "14:00")
}

func TestMergeCandidateSlots_deduplicates(t *testing.T) {
	grid := []int{8 * 60, 8*60 + 30}
	dynamic := []int{8*60 + 30}

	merged := MergeCandidateSlots(grid, dynamic)
	if len(merged) != 2 {
		t.Fatalf("expected 2 unique slots, got %d", len(merged))
	}
}

func assertContains(t *testing.T, slots []string, expected string) {
	t.Helper()
	for _, slot := range slots {
		if slot == expected {
			return
		}
	}
	t.Fatalf("expected %s in %v", expected, slots)
}

func assertNotContains(t *testing.T, slots []string, unexpected string) {
	t.Helper()
	for _, slot := range slots {
		if slot == unexpected {
			t.Fatalf("did not expect %s in %v", unexpected, slots)
		}
	}
}

func TestMinutesFromTime(t *testing.T) {
	m, err := MinutesFromTime("14:30")
	if err != nil || m != 14*60+30 {
		t.Fatalf("MinutesFromTime = %d err=%v", m, err)
	}
	if _, err := MinutesFromTime("25:00"); err == nil {
		t.Fatal("invalid time should fail")
	}
}

func TestTimeFromMinutes(t *testing.T) {
	if got := TimeFromMinutes(8*60 + 5); got != "08:05" {
		t.Fatalf("TimeFromMinutes = %q", got)
	}
}

func TestAddMinutesToTime(t *testing.T) {
	got, err := AddMinutesToTime("10:00", 45)
	if err != nil || got != "10:45" {
		t.Fatalf("AddMinutesToTime = %q err=%v", got, err)
	}
	if _, err := AddMinutesToTime("invalid", 30); err == nil {
		t.Fatal("invalid start should fail")
	}
}

func TestGenerateGridSlotStarts_edgeCases(t *testing.T) {
	if got := GenerateGridSlotStarts(8*60, 18*60, 0, 30); got != nil {
		t.Fatal("zero duration should return nil")
	}
	if got := GenerateGridSlotStarts(8*60, 18*60, 30, 0); got != nil {
		t.Fatal("zero interval should return nil")
	}
	if got := GenerateGridSlotStarts(18*60, 8*60, 30, 30); got != nil {
		t.Fatal("open >= close should return nil")
	}
}

func TestExtractReleaseTimes(t *testing.T) {
	busy := []TimeRange{{Start: 9 * 60, End: 9*60 + 40}}
	releases := ExtractReleaseTimes(busy, 8*60, 18*60, 30)
	if len(releases) != 1 || releases[0] != 9*60+40 {
		t.Fatalf("unexpected releases: %v", releases)
	}

	if got := ExtractReleaseTimes(busy, 18*60, 18*60, 30); got != nil {
		t.Fatal("maxStart < open should return nil")
	}

	dupBusy := []TimeRange{
		{Start: 9 * 60, End: 10 * 60},
		{Start: 11 * 60, End: 10 * 60},
	}
	dupReleases := ExtractReleaseTimes(dupBusy, 8*60, 18*60, 30)
	if len(dupReleases) != 1 {
		t.Fatalf("duplicate release times should dedupe, got %v", dupReleases)
	}
}

func TestFilterPastSlotsForToday_invalidDate(t *testing.T) {
	loc := mustLocation(t, "America/Sao_Paulo")
	slots := []string{"10:00", "11:00"}
	got := FilterPastSlotsForToday("invalid-date", loc, slots, time.Now())
	if len(got) != 2 {
		t.Fatal("invalid date should return slots unchanged")
	}
}

func TestFilterPastSlotsForToday_skipsInvalidSlot(t *testing.T) {
	loc := mustLocation(t, "America/Sao_Paulo")
	now := time.Date(2026, 5, 27, 14, 0, 0, 0, loc)
	slots := []string{"invalid", "15:00"}
	got := FilterPastSlotsForToday("2026-05-27", loc, slots, now)
	if len(got) != 1 || got[0] != "15:00" {
		t.Fatalf("invalid slot should be skipped, got %v", got)
	}
}

func TestParseDate(t *testing.T) {
	loc := mustLocation(t, "America/Sao_Paulo")
	parsed, err := ParseDate("2026-07-01", loc)
	if err != nil || parsed.Year() != 2026 || parsed.Month() != 7 || parsed.Day() != 1 {
		t.Fatalf("ParseDate = %v err=%v", parsed, err)
	}
}

func TestToTimeRanges(t *testing.T) {
	tr, err := ToTimeRanges("09:15", "10:45")
	if err != nil || tr.Start != 9*60+15 || tr.End != 10*60+45 {
		t.Fatalf("ToTimeRanges = %+v err=%v", tr, err)
	}
}

func TestGenerateSlotStarts_alias(t *testing.T) {
	grid := GenerateGridSlotStarts(8*60, 10*60, 30, 30)
	alias := GenerateSlotStarts(8*60, 10*60, 30, 30)
	if len(grid) != len(alias) {
		t.Fatal("GenerateSlotStarts should match GenerateGridSlotStarts")
	}
}
