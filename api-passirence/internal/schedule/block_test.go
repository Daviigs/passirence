package schedule

import (
	"api-passirence/internal/models"
	"testing"
)

func TestIsFullDay(t *testing.T) {
	if !IsFullDay("00:00", "23:59") {
		t.Fatal("expected full day")
	}
	if IsFullDay("08:00", "18:00") {
		t.Fatal("did not expect full day")
	}
}

func TestValidateTimeRange(t *testing.T) {
	if err := ValidateTimeRange("12:00", "13:00"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := ValidateTimeRange("15:00", "14:00"); err == nil {
		t.Fatal("expected error when end <= start")
	}
	if err := ValidateTimeRange("00:00", "23:59"); err != nil {
		t.Fatalf("full day should be valid: %v", err)
	}
}

func TestBlockOverlapAllowsEndBoundary(t *testing.T) {
	busy := []TimeRange{{Start: 15 * 60, End: 16 * 60}}
	if !IsSlotAvailable(16*60, 30, busy) {
		t.Fatal("16:00 should be available after 15:00-16:00 block")
	}
	if IsSlotAvailable(15*60+30, 30, busy) {
		t.Fatal("15:30 should be blocked")
	}
}

func TestIsDateFullyBlocked(t *testing.T) {
	blocks := []models.ScheduleBlock{
		{StartTime: "00:00", EndTime: "23:59"},
	}
	if !IsDateFullyBlocked(blocks) {
		t.Fatal("expected date fully blocked")
	}
	if IsDateFullyBlocked([]models.ScheduleBlock{{StartTime: "08:00", EndTime: "12:00"}}) {
		t.Fatal("partial block should not fully block date")
	}
	if IsDateFullyBlocked(nil) {
		t.Fatal("empty blocks should not fully block")
	}
}

func TestValidateTimeRange_errors(t *testing.T) {
	if err := ValidateTimeRange("", "12:00"); err == nil {
		t.Fatal("empty start should fail")
	}
	if err := ValidateTimeRange("12:00", ""); err == nil {
		t.Fatal("empty end should fail")
	}
	if err := ValidateTimeRange("invalid", "13:00"); err == nil {
		t.Fatal("invalid start should fail")
	}
	if err := ValidateTimeRange("12:00", "invalid"); err == nil {
		t.Fatal("invalid end should fail")
	}
}

func TestBlocksToTimeRanges(t *testing.T) {
	blocks := []models.ScheduleBlock{
		{StartTime: "09:00", EndTime: "10:00"},
		{StartTime: "14:00", EndTime: "15:00"},
	}
	ranges, err := BlocksToTimeRanges(blocks)
	if err != nil || len(ranges) != 2 || ranges[0].Start != 9*60 {
		t.Fatalf("unexpected ranges: %+v err=%v", ranges, err)
	}

	if _, err := BlocksToTimeRanges([]models.ScheduleBlock{{StartTime: "xx", EndTime: "10:00"}}); err == nil {
		t.Fatal("invalid block time should fail")
	}
}

func TestHasOverlap(t *testing.T) {
	existing := []TimeRange{{Start: 10 * 60, End: 11 * 60}}
	candidate := TimeRange{Start: 10*60 + 30, End: 11*60 + 30}
	if !HasOverlap(candidate, existing) {
		t.Fatal("expected overlap")
	}
	if HasOverlap(TimeRange{Start: 11 * 60, End: 12 * 60}, existing) {
		t.Fatal("adjacent range should not overlap")
	}
	if HasOverlap(candidate, nil) {
		t.Fatal("no existing ranges should not overlap")
	}
}

func TestBlockToTimeRange(t *testing.T) {
	tr, err := BlockToTimeRange(models.ScheduleBlock{StartTime: "08:30", EndTime: "09:00"})
	if err != nil || tr.Start != 8*60+30 {
		t.Fatalf("unexpected range: %+v err=%v", tr, err)
	}
}
