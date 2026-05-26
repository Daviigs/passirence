package schedule

import "testing"

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
