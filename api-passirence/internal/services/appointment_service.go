package services

import (
	"api-passirence/internal/apperror"
	"api-passirence/internal/dtos"
	"api-passirence/internal/models"
	"api-passirence/internal/repositories"
	"api-passirence/internal/schedule"
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"
)

const availabilityDaysAhead = 60

type AppointmentService struct{}

func NewAppointmentService() *AppointmentService {
	return &AppointmentService{}
}

func (s *AppointmentService) List(ctx context.Context, filters dtos.AppointmentFilters) ([]dtos.AppointmentResponse, error) {
	if filters.Date != "" {
		if err := validateDate(filters.Date); err != nil {
			return nil, err
		}
	}

	if filters.Status != "" {
		filters.Status = models.NormalizeAppointmentStatus(filters.Status)
	}

	appointments, err := repositories.ListAppointments(ctx, filters)
	if err != nil {
		return nil, apperror.Internal("falha ao listar agendamentos")
	}

	return s.enrichAppointments(ctx, appointments)
}

func (s *AppointmentService) GetByID(ctx context.Context, id int) (*dtos.AppointmentResponse, error) {
	if id <= 0 {
		return nil, apperror.Validation("id inválido")
	}

	appointment, err := repositories.GetAppointmentByID(ctx, id)
	if err != nil {
		if repositories.IsRecordNotFound(err) {
			return nil, apperror.NotFound("agendamento não encontrado")
		}
		return nil, apperror.Internal("falha ao buscar agendamento")
	}

	results, err := s.enrichAppointments(ctx, []models.Appointment{*appointment})
	if err != nil {
		return nil, err
	}

	return &results[0], nil
}

func (s *AppointmentService) GetAvailableDates(ctx context.Context) ([]string, error) {
	settings, loc, err := s.loadSettings(ctx)
	if err != nil {
		return nil, err
	}

	now := time.Now().In(loc)
	dates := make([]string, 0, availabilityDaysAhead)

	for i := 0; i < availabilityDaysAhead; i++ {
		day := now.AddDate(0, 0, i)
		if !isBusinessOpenOnDate(settings.BusinessHours, day) {
			continue
		}

		dateStr := day.Format(schedule.DateLayout)
		blocked, err := isDateGloballyBlocked(ctx, dateStr, int(day.Weekday()))
		if err != nil {
			return nil, err
		}
		if blocked {
			continue
		}

		dates = append(dates, dateStr)
	}

	return dates, nil
}

func (s *AppointmentService) GetAvailableTimes(
	ctx context.Context,
	date string,
	professionalID int,
	serviceIDs []int,
	excludeAppointmentID int,
) ([]string, error) {
	if err := validateDate(date); err != nil {
		return nil, err
	}

	if professionalID <= 0 {
		return nil, apperror.Validation("professionalId é obrigatório")
	}

	if len(serviceIDs) == 0 {
		return nil, apperror.Validation("serviceIds é obrigatório")
	}

	settings, loc, err := s.loadSettings(ctx)
	if err != nil {
		return nil, err
	}

	if err := s.ensureProfessionalExists(ctx, professionalID); err != nil {
		return nil, err
	}

	parsedDate, err := schedule.ParseDate(date, loc)
	if err != nil {
		return nil, apperror.Validation("date inválida, use o formato YYYY-MM-DD")
	}

	weekday := int(parsedDate.Weekday())

	businessHour, ok := getBusinessHourForWeekday(settings.BusinessHours, weekday)
	if !ok || !businessHour.IsOpen {
		return []string{}, nil
	}

	globalBlocked, err := isDateGloballyBlocked(ctx, date, weekday)
	if err != nil {
		return nil, err
	}
	if globalBlocked {
		return []string{}, nil
	}

	blocks, err := repositories.GetBlocksForAvailability(ctx, professionalID, date, weekday)
	if err != nil {
		return nil, apperror.Internal("falha ao buscar bloqueios de agenda")
	}
	if schedule.IsDateFullyBlocked(blocks) {
		return []string{}, nil
	}

	totalDuration, err := s.calculateTotalDuration(ctx, serviceIDs)
	if err != nil {
		return nil, err
	}

	openMinutes, err := schedule.MinutesFromTime(businessHour.OpenTime)
	if err != nil {
		return nil, apperror.Internal("horário de abertura inválido nas configurações")
	}

	closeMinutes, err := schedule.MinutesFromTime(businessHour.CloseTime)
	if err != nil {
		return nil, apperror.Internal("horário de fechamento inválido nas configurações")
	}

	busy, err := fetchBusyRanges(ctx, professionalID, date, weekday, excludeAppointmentID)
	if err != nil {
		return nil, err
	}

	candidates := schedule.BuildAvailabilityCandidates(
		openMinutes,
		closeMinutes,
		totalDuration,
		settings.SlotInterval,
		busy,
	)

	available := schedule.FilterAvailableSlots(candidates, totalDuration, busy)
	return filterPastSlotsForToday(date, loc, available), nil
}

// filterPastSlotsForToday removes slots that already passed when the selected date is today.
func filterPastSlotsForToday(date string, loc *time.Location, slots []string) []string {
	return schedule.FilterPastSlotsForToday(date, loc, slots, time.Now())
}

func (s *AppointmentService) CreateAppointment(
	ctx context.Context,
	req *dtos.CreateAppointmentRequest,
) (*dtos.AppointmentResponse, error) {
	if err := validateCreateRequest(req); err != nil {
		return nil, err
	}

	if req.Status != "" && models.NormalizeAppointmentStatus(req.Status) != models.AppointmentStatusScheduled {
		return nil, apperror.Validation("status inválido para criação; use scheduled")
	}
	status := models.AppointmentStatusScheduled

	settings, loc, err := s.loadSettings(ctx)
	if err != nil {
		return nil, err
	}

	if err := s.ensureClientCanBook(ctx, req.ClientID); err != nil {
		return nil, err
	}

	if err := s.ensureProfessionalExists(ctx, req.ProfessionalID); err != nil {
		return nil, err
	}

	totalDuration, err := s.calculateTotalDuration(ctx, req.ServiceIDs)
	if err != nil {
		return nil, err
	}

	parsedDate, err := schedule.ParseDate(req.Date, loc)
	if err != nil {
		return nil, apperror.Validation("date inválida, use o formato YYYY-MM-DD")
	}

	if err := validateDateNotInPast(parsedDate, loc); err != nil {
		return nil, err
	}

	if err := s.validateAppointmentSlot(ctx, slotValidationInput{
		ProfessionalID:       req.ProfessionalID,
		Date:                   req.Date,
		StartTime:              req.StartTime,
		TotalDuration:          totalDuration,
		ExcludeAppointmentID:   0,
		Settings:               settings,
		Location:               loc,
		ParsedDate:             parsedDate,
		RequireSlotAlignment:   false,
		RequireBusinessOpen:    true,
		RequireDateNotInPast:   true,
	}); err != nil {
		return nil, err
	}

	endTime, err := schedule.AddMinutesToTime(req.StartTime, totalDuration)
	if err != nil {
		return nil, apperror.Internal("falha ao calcular horário de término")
	}

	appointment := &models.Appointment{
		ClientID:       req.ClientID,
		ProfessionalID: req.ProfessionalID,
		Date:           req.Date,
		StartTime:      req.StartTime,
		EndTime:        endTime,
		Status:         status,
		ReminderSent:   false,
	}

	if err := repositories.CreateAppointmentWithServices(ctx, appointment, req.ServiceIDs); err != nil {
		return nil, apperror.Internal("falha ao criar agendamento")
	}

	appointment.Services = buildAppointmentServiceLinks(appointment.ID, req.ServiceIDs)
	return s.GetByID(ctx, appointment.ID)
}

func (s *AppointmentService) UpdateAppointment(
	ctx context.Context,
	id int,
	req *dtos.UpdateAppointmentRequest,
) (*dtos.AppointmentResponse, error) {
	if id <= 0 {
		return nil, apperror.Validation("id inválido")
	}

	if err := validateAppointmentUpdateRequest(req); err != nil {
		return nil, err
	}

	existing, err := repositories.GetAppointmentByID(ctx, id)
	if err != nil {
		if repositories.IsRecordNotFound(err) {
			return nil, apperror.NotFound("agendamento não encontrado")
		}
		return nil, apperror.Internal("falha ao buscar agendamento")
	}

	if !models.IsActiveAppointmentStatus(existing.Status) {
		return nil, apperror.Validation("não é possível editar agendamento cancelado ou finalizado")
	}

	nextStatus := models.NormalizeAppointmentStatus(req.Status)
	if !models.CanTransitionStatus(existing.Status, nextStatus) {
		return nil, apperror.Validation(fmt.Sprintf("transição de status inválida: %s → %s", models.NormalizeAppointmentStatus(existing.Status), nextStatus))
	}

	settings, loc, err := s.loadSettings(ctx)
	if err != nil {
		return nil, err
	}

	if err := s.ensureProfessionalExists(ctx, req.ProfessionalID); err != nil {
		return nil, err
	}

	totalDuration, err := s.calculateTotalDuration(ctx, req.ServiceIDs)
	if err != nil {
		return nil, err
	}

	parsedDate, err := schedule.ParseDate(req.Date, loc)
	if err != nil {
		return nil, apperror.Validation("date inválida, use o formato YYYY-MM-DD")
	}

	requireSlotValidation := models.IsActiveAppointmentStatus(nextStatus)
	if requireSlotValidation {
		if err := s.validateAppointmentSlot(ctx, slotValidationInput{
			ProfessionalID:       req.ProfessionalID,
			Date:                 req.Date,
			StartTime:            req.StartTime,
			TotalDuration:        totalDuration,
			ExcludeAppointmentID: id,
			Settings:             settings,
			Location:             loc,
			ParsedDate:           parsedDate,
			RequireSlotAlignment: false,
			RequireBusinessOpen:  true,
			RequireDateNotInPast: false,
		}); err != nil {
			return nil, err
		}
	}

	endTime, err := schedule.AddMinutesToTime(req.StartTime, totalDuration)
	if err != nil {
		return nil, apperror.Internal("falha ao calcular horário de término")
	}

	existing.ProfessionalID = req.ProfessionalID
	existing.Date = req.Date
	existing.StartTime = req.StartTime
	existing.EndTime = endTime
	existing.Status = nextStatus

	if err := repositories.UpdateAppointmentWithServices(ctx, existing, req.ServiceIDs); err != nil {
		return nil, apperror.Internal("falha ao atualizar agendamento")
	}

	return s.GetByID(ctx, id)
}

func (s *AppointmentService) CancelAppointment(ctx context.Context, id int) (*dtos.AppointmentResponse, error) {
	existing, err := s.getActiveAppointment(ctx, id)
	if err != nil {
		return nil, err
	}

	current := models.NormalizeAppointmentStatus(existing.Status)
	if current == models.AppointmentStatusCancelled {
		return nil, apperror.Validation("agendamento já está cancelado")
	}

	if current == models.AppointmentStatusCompleted {
		return nil, apperror.Validation("não é possível cancelar agendamento finalizado")
	}

	if err := repositories.UpdateAppointmentStatus(ctx, id, models.AppointmentStatusCancelled); err != nil {
		return nil, apperror.Internal("falha ao cancelar agendamento")
	}

	return s.GetByID(ctx, id)
}

func (s *AppointmentService) FinishAppointment(ctx context.Context, id int) (*dtos.AppointmentResponse, error) {
	existing, err := repositories.GetAppointmentByID(ctx, id)
	if err != nil {
		if repositories.IsRecordNotFound(err) {
			return nil, apperror.NotFound("agendamento não encontrado")
		}
		return nil, apperror.Internal("falha ao buscar agendamento")
	}

	current := models.NormalizeAppointmentStatus(existing.Status)
	if current == models.AppointmentStatusCancelled {
		return nil, apperror.Validation("não é possível finalizar agendamento cancelado")
	}

	if current == models.AppointmentStatusCompleted {
		return nil, apperror.Validation("agendamento já está finalizado")
	}

	if !models.IsActiveAppointmentStatus(existing.Status) {
		return nil, apperror.Validation("status atual não permite finalização")
	}

	if err := repositories.UpdateAppointmentStatus(ctx, id, models.AppointmentStatusCompleted); err != nil {
		return nil, apperror.Internal("falha ao finalizar agendamento")
	}

	return s.GetByID(ctx, id)
}

func (s *AppointmentService) getActiveAppointment(ctx context.Context, id int) (*models.Appointment, error) {
	if id <= 0 {
		return nil, apperror.Validation("id inválido")
	}

	appointment, err := repositories.GetAppointmentByID(ctx, id)
	if err != nil {
		if repositories.IsRecordNotFound(err) {
			return nil, apperror.NotFound("agendamento não encontrado")
		}
		return nil, apperror.Internal("falha ao buscar agendamento")
	}

	return appointment, nil
}

type slotValidationInput struct {
	ProfessionalID       int
	Date                 string
	StartTime            string
	TotalDuration        int
	ExcludeAppointmentID int
	Settings             *models.BarberShopSettings
	Location             *time.Location
	ParsedDate           time.Time
	RequireSlotAlignment bool
	RequireBusinessOpen  bool
	RequireDateNotInPast bool
}

func (s *AppointmentService) validateAppointmentSlot(ctx context.Context, input slotValidationInput) error {
	if input.RequireDateNotInPast {
		if err := validateDateNotInPast(input.ParsedDate, input.Location); err != nil {
			return err
		}
	}

	weekday := int(input.ParsedDate.Weekday())

	businessHour, ok := getBusinessHourForWeekday(input.Settings.BusinessHours, weekday)
	if input.RequireBusinessOpen {
		if !ok || !businessHour.IsOpen {
			return apperror.Validation("a barbearia não funciona nesta data")
		}
	}

	startMinutes, err := schedule.MinutesFromTime(input.StartTime)
	if err != nil {
		return apperror.Validation("startTime inválido, use o formato HH:MM")
	}

	if input.RequireBusinessOpen && ok && businessHour.IsOpen {
		openMinutes, err := schedule.MinutesFromTime(businessHour.OpenTime)
		if err != nil {
			return apperror.Internal("horário de abertura inválido nas configurações")
		}

		closeMinutes, err := schedule.MinutesFromTime(businessHour.CloseTime)
		if err != nil {
			return apperror.Internal("horário de fechamento inválido nas configurações")
		}

		if startMinutes < openMinutes || startMinutes+input.TotalDuration > closeMinutes {
			return apperror.Validation("horário fora do expediente da barbearia")
		}
	}

	if input.RequireSlotAlignment && startMinutes%input.Settings.SlotInterval != 0 {
		return apperror.Validation("horário não alinhado ao intervalo de slots configurado")
	}

	globalBlocked, err := isDateGloballyBlocked(ctx, input.Date, weekday)
	if err != nil {
		return err
	}
	if globalBlocked {
		return apperror.Validation("data bloqueada para a barbearia")
	}

	blocks, err := repositories.GetBlocksForAvailability(ctx, input.ProfessionalID, input.Date, weekday)
	if err != nil {
		return apperror.Internal("falha ao buscar bloqueios de agenda")
	}
	if schedule.IsDateFullyBlocked(blocks) {
		return apperror.Validation("data bloqueada para o profissional")
	}

	busy, err := fetchBusyRanges(ctx, input.ProfessionalID, input.Date, weekday, input.ExcludeAppointmentID)
	if err != nil {
		return err
	}

	if !schedule.IsSlotAvailable(startMinutes, input.TotalDuration, busy) {
		return apperror.Conflict("horário indisponível para o profissional")
	}

	return nil
}

func buildAppointmentServiceLinks(appointmentID int, serviceIDs []int) []models.AppointmentService {
	links := make([]models.AppointmentService, len(serviceIDs))
	for i, serviceID := range serviceIDs {
		links[i] = models.AppointmentService{
			AppointmentID: appointmentID,
			ServiceID:     serviceID,
		}
	}
	return links
}

func (s *AppointmentService) loadSettings(ctx context.Context) (*models.BarberShopSettings, *time.Location, error) {
	settings, err := repositories.GetSettings(ctx)
	if err != nil {
		if repositories.IsRecordNotFound(err) {
			return nil, nil, apperror.Internal("configurações da barbearia não encontradas")
		}
		return nil, nil, apperror.Internal("falha ao carregar configurações")
	}

	loc, err := time.LoadLocation(settings.Timezone)
	if err != nil {
		return nil, nil, apperror.Internal("timezone configurado é inválido")
	}

	return settings, loc, nil
}

func (s *AppointmentService) calculateTotalDuration(ctx context.Context, serviceIDs []int) (int, error) {
	if len(serviceIDs) == 0 {
		return 0, apperror.Validation("serviceIds é obrigatório")
	}

	uniqueIDs := uniqueInts(serviceIDs)
	servicos, err := repositories.GetServicosByIDs(ctx, uniqueIDs)
	if err != nil {
		return 0, apperror.Internal("falha ao buscar serviços")
	}

	servicoByID := make(map[int]models.Servico, len(servicos))
	for _, servico := range servicos {
		servicoByID[servico.ID] = servico
	}

	if len(servicoByID) != len(uniqueIDs) {
		return 0, apperror.NotFound("um ou mais serviços não foram encontrados")
	}

	total := 0
	for _, id := range serviceIDs {
		if id <= 0 {
			return 0, apperror.Validation("serviceIds contém id inválido")
		}

		servico, ok := servicoByID[id]
		if !ok {
			return 0, apperror.NotFound("um ou mais serviços não foram encontrados")
		}

		if servico.Duracao <= 0 {
			return 0, apperror.Validation(fmt.Sprintf("serviço %d possui duração inválida", servico.ID))
		}

		total += servico.Duracao
	}

	return total, nil
}

func (s *AppointmentService) ensureClientCanBook(ctx context.Context, id int) error {
	cliente, err := repositories.GetClienteByID(ctx, id)
	if err != nil {
		if repositories.IsRecordNotFound(err) {
			return apperror.NotFound("cliente não encontrado")
		}
		return apperror.Internal("falha ao buscar cliente")
	}
	if !cliente.Ativo {
		return apperror.New(
			"CLIENT_INACTIVE",
			"cliente inativo não pode realizar novos agendamentos",
			403,
		)
	}
	return nil
}

func (s *AppointmentService) ensureProfessionalExists(ctx context.Context, id int) error {
	_, err := repositories.GetProfissionalByID(ctx, id)
	if err != nil {
		if repositories.IsRecordNotFound(err) {
			return apperror.NotFound("profissional não encontrado")
		}
		return apperror.Internal("falha ao buscar profissional")
	}
	return nil
}

func isBusinessOpenOnDate(businessHours []models.BusinessHour, day time.Time) bool {
	hour, ok := getBusinessHourForWeekday(businessHours, int(day.Weekday()))
	return ok && hour.IsOpen
}

func getBusinessHourForWeekday(businessHours []models.BusinessHour, weekday int) (models.BusinessHour, bool) {
	for _, hour := range businessHours {
		if hour.WeekDay == weekday {
			return hour, true
		}
	}
	return models.BusinessHour{}, false
}

func validateDate(date string) error {
	if date == "" {
		return apperror.Validation("date é obrigatória")
	}
	if _, err := time.Parse(schedule.DateLayout, date); err != nil {
		return apperror.Validation("date inválida, use o formato YYYY-MM-DD")
	}
	return nil
}

func validateDateNotInPast(date time.Time, loc *time.Location) error {
	now := time.Now().In(loc)
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
	if date.Before(today) {
		return apperror.Validation("não é possível agendar em datas passadas")
	}
	return nil
}

func validateCreateRequest(req *dtos.CreateAppointmentRequest) error {
	if req == nil {
		return apperror.Validation("corpo da requisição é obrigatório")
	}
	if req.ClientID <= 0 {
		return apperror.Validation("clientId é obrigatório")
	}
	if req.ProfessionalID <= 0 {
		return apperror.Validation("professionalId é obrigatório")
	}
	if len(req.ServiceIDs) == 0 {
		return apperror.Validation("serviceIds é obrigatório")
	}
	if err := validateDate(req.Date); err != nil {
		return err
	}
	if req.StartTime == "" {
		return apperror.Validation("startTime é obrigatório")
	}
	if _, err := schedule.MinutesFromTime(req.StartTime); err != nil {
		return apperror.Validation("startTime inválido, use o formato HH:MM")
	}
	if req.Status != "" && models.NormalizeAppointmentStatus(req.Status) != models.AppointmentStatusScheduled {
		return apperror.Validation("status inválido para criação; use scheduled")
	}
	return nil
}

func validateAppointmentUpdateRequest(req *dtos.UpdateAppointmentRequest) error {
	if req == nil {
		return apperror.Validation("corpo da requisição é obrigatório")
	}
	if req.ProfessionalID <= 0 {
		return apperror.Validation("professionalId é obrigatório")
	}
	if len(req.ServiceIDs) == 0 {
		return apperror.Validation("serviceIds é obrigatório")
	}
	if err := validateDate(req.Date); err != nil {
		return err
	}
	if req.StartTime == "" {
		return apperror.Validation("startTime é obrigatório")
	}
	if _, err := schedule.MinutesFromTime(req.StartTime); err != nil {
		return apperror.Validation("startTime inválido, use o formato HH:MM")
	}
	if req.Status == "" {
		return apperror.Validation("status é obrigatório")
	}
	return nil
}

func extractServiceIDs(services []models.AppointmentService) []int {
	ids := make([]int, len(services))
	for i, link := range services {
		ids[i] = link.ServiceID
	}
	return ids
}

func uniqueInts(values []int) []int {
	seen := make(map[int]struct{}, len(values))
	result := make([]int, 0, len(values))

	for _, value := range values {
		if value <= 0 {
			continue
		}
		if _, exists := seen[value]; exists {
			continue
		}
		seen[value] = struct{}{}
		result = append(result, value)
	}

	return result
}

func ParseServiceIDsParam(raw string) ([]int, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, apperror.Validation("serviceIds é obrigatório")
	}

	parts := strings.Split(raw, ",")
	ids := make([]int, 0, len(parts))

	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}

		id, err := strconv.Atoi(part)
		if err != nil || id <= 0 {
			return nil, apperror.Validation("serviceIds inválido")
		}

		ids = append(ids, id)
	}

	if len(ids) == 0 {
		return nil, apperror.Validation("serviceIds é obrigatório")
	}

	return ids, nil
}

func ParseAppointmentFilters(cQuery map[string]string) (dtos.AppointmentFilters, error) {
	filters := dtos.AppointmentFilters{}

	if date := cQuery["date"]; date != "" {
		if err := validateDate(date); err != nil {
			return filters, err
		}
		filters.Date = date
	}

	if raw := cQuery["professionalId"]; raw != "" {
		id, err := strconv.Atoi(raw)
		if err != nil || id <= 0 {
			return filters, apperror.Validation("professionalId inválido")
		}
		filters.ProfessionalID = id
	}

	if raw := cQuery["clientId"]; raw != "" {
		id, err := strconv.Atoi(raw)
		if err != nil || id <= 0 {
			return filters, apperror.Validation("clientId inválido")
		}
		filters.ClientID = id
	}

	if status := cQuery["status"]; status != "" {
		filters.Status = models.NormalizeAppointmentStatus(status)
	}

	return filters, nil
}
