package repositories

import (
	"api-passirence/internal/database"
	"api-passirence/internal/dtos"
	"api-passirence/internal/models"
	"context"
)

func CreateScheduleBlock(ctx context.Context, block *models.ScheduleBlock) error {
	return database.DB.WithContext(ctx).Create(block).Error
}

func UpdateScheduleBlock(ctx context.Context, block *models.ScheduleBlock) error {
	return database.DB.WithContext(ctx).Save(block).Error
}

func DeleteScheduleBlock(ctx context.Context, id int) error {
	return database.DB.WithContext(ctx).Delete(&models.ScheduleBlock{}, id).Error
}

func GetScheduleBlockByID(ctx context.Context, id int) (*models.ScheduleBlock, error) {
	var block models.ScheduleBlock
	err := database.DB.WithContext(ctx).First(&block, id).Error
	if err != nil {
		return nil, err
	}
	return &block, nil
}

func ListScheduleBlocks(ctx context.Context, filter dtos.ScheduleBlockListFilter) ([]models.ScheduleBlock, error) {
	query := database.DB.WithContext(ctx).Model(&models.ScheduleBlock{})

	if filter.ProfessionalID != nil {
		query = query.Where("professional_id = ?", *filter.ProfessionalID)
	}

	if filter.Date != "" {
		query = query.Where("date = ?", filter.Date)
	}

	if filter.IsRecurring != nil {
		query = query.Where("is_recurring = ?", *filter.IsRecurring)
	}

	if filter.Type != "" {
		query = query.Where("type = ?", filter.Type)
	}

	var blocks []models.ScheduleBlock
	err := query.Order("id DESC").Find(&blocks).Error
	return blocks, err
}

func GetBlocksForAvailability(
	ctx context.Context,
	professionalID int,
	date string,
	weekday int,
) ([]models.ScheduleBlock, error) {
	var blocks []models.ScheduleBlock

	err := database.DB.WithContext(ctx).
		Where(
			`(is_recurring = ? AND week_day = ?) OR (is_recurring = ? AND date = ?)`,
			true, weekday, false, date,
		).
		Where("professional_id IS NULL OR professional_id = ?", professionalID).
		Find(&blocks).Error

	return blocks, err
}

func GetGlobalBlocksForDate(ctx context.Context, date string, weekday int) ([]models.ScheduleBlock, error) {
	var blocks []models.ScheduleBlock

	err := database.DB.WithContext(ctx).
		Where("professional_id IS NULL").
		Where(
			`(is_recurring = ? AND week_day = ?) OR (is_recurring = ? AND date = ?)`,
			true, weekday, false, date,
		).
		Find(&blocks).Error

	return blocks, err
}

func GetOverlappingBlocks(
	ctx context.Context,
	block *models.ScheduleBlock,
	excludeID int,
) ([]models.ScheduleBlock, error) {
	query := database.DB.WithContext(ctx).Model(&models.ScheduleBlock{})

	if excludeID > 0 {
		query = query.Where("id <> ?", excludeID)
	}

	if block.ProfessionalID == nil {
		query = query.Where("professional_id IS NULL")
	} else {
		query = query.Where("professional_id IS NULL OR professional_id = ?", *block.ProfessionalID)
	}

	if block.IsRecurring {
		if block.WeekDay == nil {
			return nil, nil
		}
		query = query.Where("is_recurring = ? AND week_day = ?", true, *block.WeekDay)
	} else {
		if block.Date == nil {
			return nil, nil
		}
		query = query.Where("is_recurring = ? AND date = ?", false, *block.Date)
	}

	var blocks []models.ScheduleBlock
	err := query.Find(&blocks).Error
	return blocks, err
}
