package services

import (
	"api-passirence/internal/apperror"
	"api-passirence/internal/dtos"
	"api-passirence/internal/models"
	"api-passirence/internal/repositories"
	"context"
	"fmt"
	"regexp"
	"sort"
	"time"
)

const (
	defaultTimezone        = "America/Sao_Paulo"
	defaultSlotInterval    = 30
	defaultReminderMinutes = 60
)

var timeHHMM = regexp.MustCompile(`^([01][0-9]|2[0-3]):[0-5][0-9]$`)

type SettingsService struct{}

func NewSettingsService() *SettingsService {
	return &SettingsService{}
}

func (s *SettingsService) GetSettings(ctx context.Context) (*dtos.SettingsResponse, error) {
	settings, err := repositories.GetSettings(ctx)
	if err != nil {
		if repositories.IsRecordNotFound(err) {
			return defaultSettingsResponse(), nil
		}
		return nil, apperror.Internal("falha ao buscar configurações")
	}

	return toSettingsResponse(settings), nil
}

func (s *SettingsService) UpdateSettings(ctx context.Context, req *dtos.UpdateSettingsRequest) (*dtos.SettingsResponse, error) {
	if err := validateUpdateRequest(req); err != nil {
		return nil, err
	}

	settings, err := repositories.GetSettings(ctx)
	if err != nil && !repositories.IsRecordNotFound(err) {
		return nil, apperror.Internal("falha ao buscar configurações")
	}

	if repositories.IsRecordNotFound(err) {
		settings = &models.BarberShopSettings{}
	}

	settings.Timezone = req.Timezone
	settings.SlotInterval = req.SlotInterval
	settings.ReminderMinutes = req.ReminderMinutes

	hours := toBusinessHours(req.BusinessHours)

	if err := repositories.UpdateSettingsWithHours(ctx, settings, hours); err != nil {
		return nil, apperror.Internal("falha ao salvar configurações")
	}

	updated, err := repositories.GetSettings(ctx)
	if err != nil {
		return nil, apperror.Internal("falha ao buscar configurações atualizadas")
	}

	return toSettingsResponse(updated), nil
}

func validateUpdateRequest(req *dtos.UpdateSettingsRequest) error {
	if req == nil {
		return apperror.Validation("corpo da requisição é obrigatório")
	}

	if req.Timezone == "" {
		return apperror.Validation("timezone é obrigatório")
	}

	if _, err := time.LoadLocation(req.Timezone); err != nil {
		return apperror.Validation(fmt.Sprintf("timezone inválido: %s", req.Timezone))
	}

	if req.SlotInterval <= 0 {
		return apperror.Validation("slotInterval deve ser maior que zero")
	}

	if req.SlotInterval > 240 {
		return apperror.Validation("slotInterval não pode ser maior que 240 minutos")
	}

	if req.ReminderMinutes < 0 {
		return apperror.Validation("reminderMinutes não pode ser negativo")
	}

	if len(req.BusinessHours) == 0 {
		return apperror.Validation("businessHours é obrigatório")
	}

	seenWeekdays := make(map[int]struct{}, len(req.BusinessHours))

	for _, hour := range req.BusinessHours {
		if hour.WeekDay < 0 || hour.WeekDay > 6 {
			return apperror.Validation(fmt.Sprintf("weekday inválido: %d (use 0=domingo até 6=sábado)", hour.WeekDay))
		}

		if _, exists := seenWeekdays[hour.WeekDay]; exists {
			return apperror.Validation(fmt.Sprintf("weekday duplicado: %d", hour.WeekDay))
		}
		seenWeekdays[hour.WeekDay] = struct{}{}

		if hour.IsOpen {
			if hour.OpenTime == "" || hour.CloseTime == "" {
				return apperror.Validation(fmt.Sprintf("openTime e closeTime são obrigatórios quando isOpen é true (weekday %d)", hour.WeekDay))
			}

			if !timeHHMM.MatchString(hour.OpenTime) {
				return apperror.Validation(fmt.Sprintf("openTime inválido para weekday %d: use o formato HH:MM", hour.WeekDay))
			}

			if !timeHHMM.MatchString(hour.CloseTime) {
				return apperror.Validation(fmt.Sprintf("closeTime inválido para weekday %d: use o formato HH:MM", hour.WeekDay))
			}

			if !isCloseAfterOpen(hour.OpenTime, hour.CloseTime) {
				return apperror.Validation(fmt.Sprintf("closeTime deve ser posterior a openTime (weekday %d)", hour.WeekDay))
			}
		}
	}

	return nil
}

func isCloseAfterOpen(openTime, closeTime string) bool {
	open, errOpen := time.Parse("15:04", openTime)
	closeT, errClose := time.Parse("15:04", closeTime)
	if errOpen != nil || errClose != nil {
		return false
	}
	return closeT.After(open)
}

func toBusinessHours(inputs []dtos.BusinessHourInput) []models.BusinessHour {
	hours := make([]models.BusinessHour, len(inputs))
	for i, input := range inputs {
		hours[i] = models.BusinessHour{
			WeekDay:   input.WeekDay,
			OpenTime:  input.OpenTime,
			CloseTime: input.CloseTime,
			IsOpen:    input.IsOpen,
		}
	}
	return hours
}

func toSettingsResponse(settings *models.BarberShopSettings) *dtos.SettingsResponse {
	hours := make([]dtos.BusinessHourResponse, len(settings.BusinessHours))

	sort.Slice(settings.BusinessHours, func(i, j int) bool {
		return settings.BusinessHours[i].WeekDay < settings.BusinessHours[j].WeekDay
	})

	for i, hour := range settings.BusinessHours {
		resp := dtos.BusinessHourResponse{
			WeekDay: hour.WeekDay,
			IsOpen:  hour.IsOpen,
		}
		if hour.IsOpen {
			resp.OpenTime = hour.OpenTime
			resp.CloseTime = hour.CloseTime
		}
		hours[i] = resp
	}

	return &dtos.SettingsResponse{
		Timezone:        settings.Timezone,
		SlotInterval:    settings.SlotInterval,
		ReminderMinutes: settings.ReminderMinutes,
		BusinessHours:   hours,
	}
}

func defaultSettingsResponse() *dtos.SettingsResponse {
	return &dtos.SettingsResponse{
		Timezone:        defaultTimezone,
		SlotInterval:    defaultSlotInterval,
		ReminderMinutes: defaultReminderMinutes,
		BusinessHours:   []dtos.BusinessHourResponse{},
	}
}
