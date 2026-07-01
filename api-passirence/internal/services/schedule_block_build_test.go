package services

import (
	"api-passirence/internal/dtos"
	"api-passirence/internal/models"
	"testing"
)

func TestBuildBlockFromCreate(t *testing.T) {
	svc := NewScheduleBlockService()
	date := "2026-07-01"
	profID := 5

	block, err := svc.buildBlockFromCreate(&dtos.CreateScheduleBlockRequest{
		ProfessionalID: &profID,
		Type:           "  LUNCH  ",
		IsRecurring:    false,
		Date:           &date,
		StartTime:      " 12:00 ",
		EndTime:        "13:00 ",
		Reason:         " Almoço ",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if block.Type != "LUNCH" || block.StartTime != "12:00" || block.Reason != "Almoço" {
		t.Fatalf("unexpected block: %+v", block)
	}
	if block.WeekDay != nil {
		t.Fatal("one-off block should not have weekday")
	}

	if _, err := svc.buildBlockFromCreate(nil); err == nil {
		t.Fatal("nil request should fail")
	}
}

func TestBuildBlockFromUpdate(t *testing.T) {
	svc := NewScheduleBlockService()
	date := "2026-08-01"

	block, err := svc.buildBlockFromUpdate(&dtos.UpdateScheduleBlockRequest{
		Type:        "BREAK",
		IsRecurring: true,
		WeekDay:     intPtr(3),
		StartTime:   "15:00",
		EndTime:     "15:30",
		Date:        &date,
	}, 99)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if block.ID != 99 || block.Type != "BREAK" {
		t.Fatalf("unexpected block: %+v", block)
	}

	if _, err := svc.buildBlockFromUpdate(nil, 1); err == nil {
		t.Fatal("nil request should fail")
	}
}

func TestMapScheduleBlockToResponse(t *testing.T) {
	profID := 2
	weekDay := 1
	date := "2026-07-01"
	block := &models.ScheduleBlock{
		ID: 10, ProfessionalID: &profID, Type: "VACATION",
		IsRecurring: true, WeekDay: &weekDay, Date: &date,
		StartTime: "00:00", EndTime: "23:59", Reason: "Férias",
	}

	resp := mapScheduleBlockToResponse(block)
	if resp.ID != 10 || resp.Type != "VACATION" || *resp.ProfessionalID != 2 {
		t.Fatalf("unexpected response: %+v", resp)
	}
}

func intPtr(v int) *int { return &v }
