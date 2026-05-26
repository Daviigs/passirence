package services

import (
	"api-passirence/internal/apperror"
	"api-passirence/internal/dtos"
	"api-passirence/internal/models"
	"api-passirence/internal/repositories"
	"api-passirence/internal/schedule"
	"context"
	"strings"
)

type ScheduleBlockService struct{}

func NewScheduleBlockService() *ScheduleBlockService {
	return &ScheduleBlockService{}
}

func (s *ScheduleBlockService) Create(ctx context.Context, req *dtos.CreateScheduleBlockRequest) (*dtos.ScheduleBlockResponse, error) {
	block, err := s.buildBlockFromCreate(req)
	if err != nil {
		return nil, err
	}

	if err := s.validateBlock(ctx, block, 0); err != nil {
		return nil, err
	}

	if err := repositories.CreateScheduleBlock(ctx, block); err != nil {
		return nil, apperror.Internal("falha ao criar bloqueio")
	}

	return mapScheduleBlockToResponse(block), nil
}

func (s *ScheduleBlockService) List(ctx context.Context, filter dtos.ScheduleBlockListFilter) ([]dtos.ScheduleBlockResponse, error) {
	blocks, err := repositories.ListScheduleBlocks(ctx, filter)
	if err != nil {
		return nil, apperror.Internal("falha ao listar bloqueios")
	}

	result := make([]dtos.ScheduleBlockResponse, 0, len(blocks))
	for i := range blocks {
		result = append(result, *mapScheduleBlockToResponse(&blocks[i]))
	}

	return result, nil
}

func (s *ScheduleBlockService) GetByID(ctx context.Context, id int) (*dtos.ScheduleBlockResponse, error) {
	if id <= 0 {
		return nil, apperror.Validation("id inválido")
	}

	block, err := repositories.GetScheduleBlockByID(ctx, id)
	if err != nil {
		if repositories.IsRecordNotFound(err) {
			return nil, apperror.NotFound("bloqueio não encontrado")
		}
		return nil, apperror.Internal("falha ao buscar bloqueio")
	}

	return mapScheduleBlockToResponse(block), nil
}

func (s *ScheduleBlockService) Update(ctx context.Context, id int, req *dtos.UpdateScheduleBlockRequest) (*dtos.ScheduleBlockResponse, error) {
	if id <= 0 {
		return nil, apperror.Validation("id inválido")
	}

	existing, err := repositories.GetScheduleBlockByID(ctx, id)
	if err != nil {
		if repositories.IsRecordNotFound(err) {
			return nil, apperror.NotFound("bloqueio não encontrado")
		}
		return nil, apperror.Internal("falha ao buscar bloqueio")
	}

	block, err := s.buildBlockFromUpdate(req, existing.ID)
	if err != nil {
		return nil, err
	}
	block.CreatedAt = existing.CreatedAt

	if err := s.validateBlock(ctx, block, id); err != nil {
		return nil, err
	}

	if err := repositories.UpdateScheduleBlock(ctx, block); err != nil {
		return nil, apperror.Internal("falha ao atualizar bloqueio")
	}

	return mapScheduleBlockToResponse(block), nil
}

func (s *ScheduleBlockService) Delete(ctx context.Context, id int) error {
	if id <= 0 {
		return apperror.Validation("id inválido")
	}

	_, err := repositories.GetScheduleBlockByID(ctx, id)
	if err != nil {
		if repositories.IsRecordNotFound(err) {
			return apperror.NotFound("bloqueio não encontrado")
		}
		return apperror.Internal("falha ao buscar bloqueio")
	}

	if err := repositories.DeleteScheduleBlock(ctx, id); err != nil {
		return apperror.Internal("falha ao remover bloqueio")
	}

	return nil
}

func (s *ScheduleBlockService) buildBlockFromCreate(req *dtos.CreateScheduleBlockRequest) (*models.ScheduleBlock, error) {
	if req == nil {
		return nil, apperror.Validation("corpo da requisição é obrigatório")
	}

	return &models.ScheduleBlock{
		ProfessionalID: req.ProfessionalID,
		Type:           strings.TrimSpace(req.Type),
		IsRecurring:    req.IsRecurring,
		WeekDay:        req.WeekDay,
		Date:           req.Date,
		StartTime:      strings.TrimSpace(req.StartTime),
		EndTime:        strings.TrimSpace(req.EndTime),
		Reason:         strings.TrimSpace(req.Reason),
	}, nil
}

func (s *ScheduleBlockService) buildBlockFromUpdate(req *dtos.UpdateScheduleBlockRequest, id int) (*models.ScheduleBlock, error) {
	if req == nil {
		return nil, apperror.Validation("corpo da requisição é obrigatório")
	}

	return &models.ScheduleBlock{
		ID:             id,
		ProfessionalID: req.ProfessionalID,
		Type:           strings.TrimSpace(req.Type),
		IsRecurring:    req.IsRecurring,
		WeekDay:        req.WeekDay,
		Date:           req.Date,
		StartTime:      strings.TrimSpace(req.StartTime),
		EndTime:        strings.TrimSpace(req.EndTime),
		Reason:         strings.TrimSpace(req.Reason),
	}, nil
}

func (s *ScheduleBlockService) validateBlock(ctx context.Context, block *models.ScheduleBlock, excludeID int) error {
	if block.Type == "" {
		return apperror.Validation("type é obrigatório")
	}

	if err := schedule.ValidateTimeRange(block.StartTime, block.EndTime); err != nil {
		return apperror.Validation(err.Error())
	}

	if block.IsRecurring {
		if block.WeekDay == nil {
			return apperror.Validation("weekday é obrigatório para bloqueios recorrentes")
		}
		if *block.WeekDay < 0 || *block.WeekDay > 6 {
			return apperror.Validation("weekday inválido (use 0=domingo até 6=sábado)")
		}
		if block.Date != nil && *block.Date != "" {
			return apperror.Validation("date não deve ser informada para bloqueios recorrentes")
		}
	} else {
		if block.Date == nil || *block.Date == "" {
			return apperror.Validation("date é obrigatória para bloqueios avulsos")
		}
		if err := validateDate(*block.Date); err != nil {
			return err
		}
		if block.WeekDay != nil {
			return apperror.Validation("weekday não deve ser informado para bloqueios avulsos")
		}
	}

	if block.ProfessionalID != nil && *block.ProfessionalID <= 0 {
		return apperror.Validation("professionalId inválido")
	}

	if block.ProfessionalID != nil {
		if err := ensureProfessionalExists(ctx, *block.ProfessionalID); err != nil {
			return err
		}
	}

	candidate, err := schedule.BlockToTimeRange(*block)
	if err != nil {
		return apperror.Validation("horário do bloqueio inválido")
	}

	existing, err := repositories.GetOverlappingBlocks(ctx, block, excludeID)
	if err != nil {
		return apperror.Internal("falha ao validar sobreposição de bloqueios")
	}

	existingRanges, err := schedule.BlocksToTimeRanges(existing)
	if err != nil {
		return apperror.Internal("bloqueio existente com horário inválido")
	}

	if schedule.HasOverlap(candidate, existingRanges) {
		return apperror.Conflict("bloqueio sobrepõe outro bloqueio existente no mesmo período")
	}

	return nil
}

func mapScheduleBlockToResponse(block *models.ScheduleBlock) *dtos.ScheduleBlockResponse {
	return &dtos.ScheduleBlockResponse{
		ID:             block.ID,
		ProfessionalID: block.ProfessionalID,
		Type:           block.Type,
		IsRecurring:    block.IsRecurring,
		WeekDay:        block.WeekDay,
		Date:           block.Date,
		StartTime:      block.StartTime,
		EndTime:        block.EndTime,
		Reason:         block.Reason,
	}
}

func ensureProfessionalExists(ctx context.Context, id int) error {
	_, err := repositories.GetProfissionalByID(ctx, id)
	if err != nil {
		if repositories.IsRecordNotFound(err) {
			return apperror.NotFound("profissional não encontrado")
		}
		return apperror.Internal("falha ao buscar profissional")
	}
	return nil
}
