package services

import (
	"api-passirence/internal/dtos"
	"api-passirence/internal/models"
	"testing"
)

func validUpdateRequest() *dtos.UpdateSettingsRequest {
	return &dtos.UpdateSettingsRequest{
		Timezone:        "America/Sao_Paulo",
		SlotInterval:    30,
		ReminderMinutes: 60,
		BusinessHours: []dtos.BusinessHourInput{
			{WeekDay: 1, IsOpen: true, OpenTime: "08:00", CloseTime: "18:00"},
		},
	}
}

func TestValidateUpdateRequest_happyPath(t *testing.T) {
	if err := validateUpdateRequest(validUpdateRequest()); err != nil {
		t.Fatalf("valid request should pass: %v", err)
	}
}

func TestValidateUpdateRequest_nilBody(t *testing.T) {
	if err := validateUpdateRequest(nil); err == nil {
		t.Fatal("nil body should fail")
	}
}

func TestValidateUpdateRequest_timezone(t *testing.T) {
	req := validUpdateRequest()
	req.Timezone = ""
	if err := validateUpdateRequest(req); err == nil {
		t.Fatal("empty timezone should fail")
	}

	req = validUpdateRequest()
	req.Timezone = "Invalid/Zone"
	if err := validateUpdateRequest(req); err == nil {
		t.Fatal("invalid timezone should fail")
	}
}

func TestValidateUpdateRequest_slotInterval(t *testing.T) {
	req := validUpdateRequest()
	req.SlotInterval = 0
	if err := validateUpdateRequest(req); err == nil {
		t.Fatal("zero slotInterval should fail")
	}

	req = validUpdateRequest()
	req.SlotInterval = 241
	if err := validateUpdateRequest(req); err == nil {
		t.Fatal("slotInterval > 240 should fail")
	}
}

func TestValidateUpdateRequest_reminderMinutes(t *testing.T) {
	req := validUpdateRequest()
	req.ReminderMinutes = -1
	if err := validateUpdateRequest(req); err == nil {
		t.Fatal("negative reminderMinutes should fail")
	}
}

func TestValidateUpdateRequest_businessHours(t *testing.T) {
	req := validUpdateRequest()
	req.BusinessHours = nil
	if err := validateUpdateRequest(req); err == nil {
		t.Fatal("empty businessHours should fail")
	}

	req = validUpdateRequest()
	req.BusinessHours = []dtos.BusinessHourInput{
		{WeekDay: 7, IsOpen: false},
	}
	if err := validateUpdateRequest(req); err == nil {
		t.Fatal("invalid weekday should fail")
	}

	req = validUpdateRequest()
	req.BusinessHours = []dtos.BusinessHourInput{
		{WeekDay: 1, IsOpen: true, OpenTime: "08:00", CloseTime: "18:00"},
		{WeekDay: 1, IsOpen: false},
	}
	if err := validateUpdateRequest(req); err == nil {
		t.Fatal("duplicate weekday should fail")
	}

	req = validUpdateRequest()
	req.BusinessHours = []dtos.BusinessHourInput{
		{WeekDay: 2, IsOpen: true, OpenTime: "", CloseTime: "18:00"},
	}
	if err := validateUpdateRequest(req); err == nil {
		t.Fatal("open day without times should fail")
	}

	req = validUpdateRequest()
	req.BusinessHours = []dtos.BusinessHourInput{
		{WeekDay: 2, IsOpen: true, OpenTime: "25:00", CloseTime: "18:00"},
	}
	if err := validateUpdateRequest(req); err == nil {
		t.Fatal("invalid openTime should fail")
	}

	req = validUpdateRequest()
	req.BusinessHours = []dtos.BusinessHourInput{
		{WeekDay: 2, IsOpen: true, OpenTime: "18:00", CloseTime: "08:00"},
	}
	if err := validateUpdateRequest(req); err == nil {
		t.Fatal("close before open should fail")
	}

	req = validUpdateRequest()
	req.BusinessHours = []dtos.BusinessHourInput{
		{WeekDay: 2, IsOpen: true, OpenTime: "08:00", CloseTime: "25:00"},
	}
	if err := validateUpdateRequest(req); err == nil {
		t.Fatal("invalid closeTime should fail")
	}
}

func TestIsCloseAfterOpen(t *testing.T) {
	if !isCloseAfterOpen("08:00", "18:00") {
		t.Fatal("08:00-18:00 should be valid")
	}
	if isCloseAfterOpen("18:00", "08:00") {
		t.Fatal("18:00-08:00 should be invalid")
	}
	if isCloseAfterOpen("invalid", "18:00") {
		t.Fatal("invalid open should return false")
	}
}

func TestToBusinessHours(t *testing.T) {
	inputs := []dtos.BusinessHourInput{
		{WeekDay: 3, OpenTime: "09:00", CloseTime: "17:00", IsOpen: true},
	}
	got := toBusinessHours(inputs)
	if len(got) != 1 || got[0].WeekDay != 3 || !got[0].IsOpen {
		t.Fatalf("unexpected hours: %+v", got)
	}
}

func TestToSettingsResponse(t *testing.T) {
	settings := &models.BarberShopSettings{
		Timezone:        "America/Sao_Paulo",
		SlotInterval:    30,
		ReminderMinutes: 60,
		BusinessHours: []models.BusinessHour{
			{WeekDay: 2, IsOpen: true, OpenTime: "09:00", CloseTime: "17:00"},
			{WeekDay: 0, IsOpen: false},
		},
	}

	resp := toSettingsResponse(settings)
	if resp.Timezone != "America/Sao_Paulo" || len(resp.BusinessHours) != 2 {
		t.Fatalf("unexpected response: %+v", resp)
	}
	if resp.BusinessHours[0].WeekDay != 0 {
		t.Fatal("business hours should be sorted by weekday")
	}
	closed := resp.BusinessHours[0]
	if closed.IsOpen || closed.OpenTime != "" || closed.CloseTime != "" {
		t.Fatal("closed day should omit open/close times in response")
	}
}

func TestDefaultSettingsResponse(t *testing.T) {
	resp := defaultSettingsResponse()
	if resp.Timezone != "America/Sao_Paulo" || resp.SlotInterval != 30 {
		t.Fatalf("unexpected defaults: %+v", resp)
	}
	if len(resp.BusinessHours) != 0 {
		t.Fatal("default business hours should be empty")
	}
}
