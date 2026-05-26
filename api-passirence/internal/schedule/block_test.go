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
}
