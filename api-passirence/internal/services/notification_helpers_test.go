package services

import (
	"api-passirence/internal/dtos"
	"testing"
)

func TestJoinServiceNames(t *testing.T) {
	if joinServiceNames(nil) != "Serviço" {
		t.Fatal("empty list should return default label")
	}
	if joinServiceNames([]dtos.AppointmentServiceItem{{Name: ""}}) != "Serviço" {
		t.Fatal("empty names should return default label")
	}

	got := joinServiceNames([]dtos.AppointmentServiceItem{
		{Name: "Corte"},
		{Name: "Barba"},
	})
	if got != "Corte, Barba" {
		t.Fatalf("joinServiceNames = %q", got)
	}
}

func TestFormatDateBR(t *testing.T) {
	if formatDateBR("2026-07-01") != "01/07/2026" {
		t.Fatalf("unexpected BR date: %q", formatDateBR("2026-07-01"))
	}
	if formatDateBR("invalid") != "invalid" {
		t.Fatal("invalid ISO should return original string")
	}
}

func TestFormatTimeHHMM(t *testing.T) {
	if formatTimeHHMM("  10:30:00  ") != "10:30" {
		t.Fatalf("unexpected time: %q", formatTimeHHMM("  10:30:00  "))
	}
	if formatTimeHHMM("9") != "9" {
		t.Fatalf("short time should be returned as-is: %q", formatTimeHHMM("9"))
	}
}

func TestCanNotify(t *testing.T) {
	svc := &AppointmentNotificationService{whatsapp: nil}
	if svc.canNotify(&dtos.AppointmentResponse{ID: 1}) {
		t.Fatal("nil whatsapp client should not notify")
	}
	if svc.canNotify(nil) {
		t.Fatal("nil appointment should not notify")
	}
}
