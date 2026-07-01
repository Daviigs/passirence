package services

import (
	"api-passirence/internal/dtos"
	"api-passirence/internal/models"
	"testing"
	"time"
)

func TestValidateDate(t *testing.T) {
	if err := validateDate("2026-07-01"); err != nil {
		t.Fatalf("valid date should pass: %v", err)
	}
	if err := validateDate(""); err == nil {
		t.Fatal("empty date should fail")
	}
	if err := validateDate("01-07-2026"); err == nil {
		t.Fatal("invalid format should fail")
	}
}

func TestValidateDateNotInPast(t *testing.T) {
	loc := mustLoadLocation(t, "America/Sao_Paulo")
	today := time.Now().In(loc)
	todayDate := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, loc)

	if err := validateDateNotInPast(todayDate, loc); err != nil {
		t.Fatalf("today should be valid: %v", err)
	}

	yesterday := todayDate.AddDate(0, 0, -1)
	if err := validateDateNotInPast(yesterday, loc); err == nil {
		t.Fatal("past date should fail")
	}
}

func TestValidateCreateRequest(t *testing.T) {
	valid := &dtos.CreateAppointmentRequest{
		ClientID:       1,
		ProfessionalID: 2,
		ServiceIDs:     []int{3},
		Date:           "2026-12-01",
		StartTime:      "10:00",
	}
	if err := validateCreateRequest(valid); err != nil {
		t.Fatalf("valid request should pass: %v", err)
	}

	cases := []struct {
		name string
		req  *dtos.CreateAppointmentRequest
	}{
		{"nil body", nil},
		{"missing client", &dtos.CreateAppointmentRequest{ProfessionalID: 1, ServiceIDs: []int{1}, Date: "2026-12-01", StartTime: "10:00"}},
		{"missing professional", &dtos.CreateAppointmentRequest{ClientID: 1, ServiceIDs: []int{1}, Date: "2026-12-01", StartTime: "10:00"}},
		{"missing services", &dtos.CreateAppointmentRequest{ClientID: 1, ProfessionalID: 1, Date: "2026-12-01", StartTime: "10:00"}},
		{"invalid date", &dtos.CreateAppointmentRequest{ClientID: 1, ProfessionalID: 1, ServiceIDs: []int{1}, Date: "invalid", StartTime: "10:00"}},
		{"missing startTime", &dtos.CreateAppointmentRequest{ClientID: 1, ProfessionalID: 1, ServiceIDs: []int{1}, Date: "2026-12-01"}},
		{"invalid startTime", &dtos.CreateAppointmentRequest{ClientID: 1, ProfessionalID: 1, ServiceIDs: []int{1}, Date: "2026-12-01", StartTime: "25:00"}},
		{"invalid status", &dtos.CreateAppointmentRequest{ClientID: 1, ProfessionalID: 1, ServiceIDs: []int{1}, Date: "2026-12-01", StartTime: "10:00", Status: "completed"}},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if err := validateCreateRequest(tc.req); err == nil {
				t.Fatal("expected validation error")
			}
		})
	}

	scheduled := &dtos.CreateAppointmentRequest{
		ClientID: 1, ProfessionalID: 1, ServiceIDs: []int{1},
		Date: "2026-12-01", StartTime: "10:00", Status: "scheduled",
	}
	if err := validateCreateRequest(scheduled); err != nil {
		t.Fatalf("scheduled status should be allowed: %v", err)
	}
}

func TestValidateAppointmentUpdateRequest(t *testing.T) {
	valid := &dtos.UpdateAppointmentRequest{
		ProfessionalID: 1,
		ServiceIDs:     []int{2},
		Date:           "2026-12-01",
		StartTime:      "11:00",
		Status:         "scheduled",
	}
	if err := validateAppointmentUpdateRequest(valid); err != nil {
		t.Fatalf("valid update should pass: %v", err)
	}

	if err := validateAppointmentUpdateRequest(nil); err == nil {
		t.Fatal("nil body should fail")
	}
	if err := validateAppointmentUpdateRequest(&dtos.UpdateAppointmentRequest{
		ProfessionalID: 0, ServiceIDs: []int{1}, Date: "2026-12-01", StartTime: "10:00", Status: "scheduled",
	}); err == nil {
		t.Fatal("invalid professional should fail")
	}
	if err := validateAppointmentUpdateRequest(&dtos.UpdateAppointmentRequest{
		ProfessionalID: 1, ServiceIDs: nil, Date: "2026-12-01", StartTime: "10:00", Status: "scheduled",
	}); err == nil {
		t.Fatal("empty services should fail")
	}
	if err := validateAppointmentUpdateRequest(&dtos.UpdateAppointmentRequest{
		ProfessionalID: 1, ServiceIDs: []int{1}, Date: "2026-12-01", StartTime: "10:00", Status: "",
	}); err == nil {
		t.Fatal("empty status should fail")
	}
	if err := validateAppointmentUpdateRequest(&dtos.UpdateAppointmentRequest{
		ProfessionalID: 1, ServiceIDs: []int{1}, Date: "2026-12-01", StartTime: "25:00", Status: "scheduled",
	}); err == nil {
		t.Fatal("invalid startTime should fail")
	}
	if err := validateAppointmentUpdateRequest(&dtos.UpdateAppointmentRequest{
		ProfessionalID: 1, ServiceIDs: []int{1}, Date: "invalid", StartTime: "10:00", Status: "scheduled",
	}); err == nil {
		t.Fatal("invalid date should fail")
	}
}

func TestUniqueInts(t *testing.T) {
	got := uniqueInts([]int{3, 1, 3, 0, -1, 2, 1})
	want := []int{3, 1, 2}
	if len(got) != len(want) {
		t.Fatalf("uniqueInts = %v, want %v", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("uniqueInts = %v, want %v", got, want)
		}
	}
	if len(uniqueInts(nil)) != 0 {
		t.Fatal("nil input should return empty slice")
	}
}

func TestExtractServiceIDs(t *testing.T) {
	links := []models.AppointmentService{
		{ServiceID: 10},
		{ServiceID: 20},
	}
	got := extractServiceIDs(links)
	if len(got) != 2 || got[0] != 10 || got[1] != 20 {
		t.Fatalf("extractServiceIDs = %v", got)
	}
	if len(extractServiceIDs(nil)) != 0 {
		t.Fatal("nil input should return empty slice")
	}
}

func TestBuildAppointmentServiceLinks(t *testing.T) {
	links := buildAppointmentServiceLinks(5, []int{1, 2})
	if len(links) != 2 || links[0].AppointmentID != 5 || links[1].ServiceID != 2 {
		t.Fatalf("unexpected links: %+v", links)
	}
}

func TestParseServiceIDsParam(t *testing.T) {
	ids, err := ParseServiceIDsParam("1, 2,3")
	if err != nil || len(ids) != 3 || ids[0] != 1 || ids[2] != 3 {
		t.Fatalf("ParseServiceIDsParam = %v, err = %v", ids, err)
	}

	errorCases := []string{"", "abc", "0", ",,"}
	for _, raw := range errorCases {
		if _, err := ParseServiceIDsParam(raw); err == nil {
			t.Fatalf("expected error for %q", raw)
		}
	}

	if _, err := ParseServiceIDsParam("  ,  "); err == nil {
		t.Fatal("whitespace-only parts should fail")
	}
}

func TestParseAppointmentFilters(t *testing.T) {
	filters, err := ParseAppointmentFilters(map[string]string{
		"date":           "2026-07-01",
		"professionalId": "3",
		"clientId":       "7",
		"status":         "confirmed",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if filters.Date != "2026-07-01" || filters.ProfessionalID != 3 || filters.ClientID != 7 {
		t.Fatalf("unexpected filters: %+v", filters)
	}
	if filters.Status != models.AppointmentStatusScheduled {
		t.Fatalf("status should normalize to scheduled, got %q", filters.Status)
	}

	if _, err := ParseAppointmentFilters(map[string]string{"date": "invalid"}); err == nil {
		t.Fatal("invalid date should fail")
	}
	if _, err := ParseAppointmentFilters(map[string]string{"professionalId": "x"}); err == nil {
		t.Fatal("invalid professionalId should fail")
	}
	if _, err := ParseAppointmentFilters(map[string]string{"clientId": "0"}); err == nil {
		t.Fatal("invalid clientId should fail")
	}

	empty, err := ParseAppointmentFilters(map[string]string{})
	if err != nil || empty.Date != "" {
		t.Fatalf("empty query should return empty filters, got %+v err=%v", empty, err)
	}
}

func TestGetBusinessHourForWeekday(t *testing.T) {
	hours := []models.BusinessHour{
		{WeekDay: 1, IsOpen: true, OpenTime: "08:00", CloseTime: "18:00"},
	}
	got, ok := getBusinessHourForWeekday(hours, 1)
	if !ok || got.WeekDay != 1 {
		t.Fatalf("expected weekday 1, got %+v ok=%v", got, ok)
	}
	if _, ok := getBusinessHourForWeekday(hours, 9); ok {
		t.Fatal("missing weekday should return false")
	}
}

func TestIsBusinessOpenOnDate(t *testing.T) {
	hours := []models.BusinessHour{
		{WeekDay: 1, IsOpen: true},
		{WeekDay: 0, IsOpen: false},
	}
	monday := time.Date(2026, 7, 6, 12, 0, 0, 0, time.UTC) // Monday
	sunday := time.Date(2026, 7, 5, 12, 0, 0, 0, time.UTC)

	if !isBusinessOpenOnDate(hours, monday) {
		t.Fatal("monday should be open")
	}
	if isBusinessOpenOnDate(hours, sunday) {
		t.Fatal("sunday should be closed")
	}
}

func TestMapAppointmentToRichResponse(t *testing.T) {
	appointment := &models.Appointment{
		ID: 1, ClientID: 10, ProfessionalID: 20,
		Date: "2026-07-01", StartTime: "10:00", EndTime: "11:00",
		Status: "confirmed",
		Services: []models.AppointmentService{{ServiceID: 100}},
	}
	cliente := models.Cliente{ID: 10, Nome: "João"}
	prof := models.Profissional{ID: 20, Nome: "Carlos"}
	servicos := map[int]models.Servico{
		100: {ID: 100, Nome: "Corte", Duracao: 30},
	}

	resp := mapAppointmentToRichResponse(appointment, cliente, prof, servicos)
	if resp.ClientName != "João" || resp.ProfessionalName != "Carlos" {
		t.Fatalf("unexpected names: %+v", resp)
	}
	if resp.Status != models.AppointmentStatusScheduled {
		t.Fatalf("status should normalize, got %q", resp.Status)
	}
	if len(resp.Services) != 1 || resp.Services[0].Name != "Corte" {
		t.Fatalf("unexpected services: %+v", resp.Services)
	}
}

func TestMapAppointmentToRichResponse_missingService(t *testing.T) {
	appointment := &models.Appointment{
		ID: 1, Services: []models.AppointmentService{{ServiceID: 999}},
	}
	resp := mapAppointmentToRichResponse(appointment, models.Cliente{}, models.Profissional{}, map[int]models.Servico{})
	if len(resp.Services) != 0 {
		t.Fatalf("missing service should be skipped, got %+v", resp.Services)
	}
}


func mustLoadLocation(t *testing.T, name string) *time.Location {
	t.Helper()
	loc, err := time.LoadLocation(name)
	if err != nil {
		t.Fatalf("load location: %v", err)
	}
	return loc
}
