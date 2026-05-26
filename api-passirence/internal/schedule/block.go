package schedule

import (
	"fmt"

	"api-passirence/internal/models"
)

const fullDayStart = "00:00"
const fullDayEnd = "23:59"

func IsFullDay(startTime, endTime string) bool {
	return startTime == fullDayStart && endTime == fullDayEnd
}

func ValidateTimeRange(startTime, endTime string) error {
	if startTime == "" || endTime == "" {
		return fmt.Errorf("startTime e endTime são obrigatórios")
	}

	start, err := MinutesFromTime(startTime)
	if err != nil {
		return fmt.Errorf("startTime inválido: use o formato HH:MM")
	}

	end, err := MinutesFromTime(endTime)
	if err != nil {
		return fmt.Errorf("endTime inválido: use o formato HH:MM")
	}

	if IsFullDay(startTime, endTime) {
		return nil
	}

	if end <= start {
		return fmt.Errorf("endTime deve ser posterior a startTime")
	}

	return nil
}

func BlockToTimeRange(block models.ScheduleBlock) (TimeRange, error) {
	return ToTimeRanges(block.StartTime, block.EndTime)
}

func BlocksToTimeRanges(blocks []models.ScheduleBlock) ([]TimeRange, error) {
	ranges := make([]TimeRange, 0, len(blocks))
	for _, block := range blocks {
		timeRange, err := BlockToTimeRange(block)
		if err != nil {
			return nil, err
		}
		ranges = append(ranges, timeRange)
	}
	return ranges, nil
}

func HasOverlap(candidate TimeRange, existing []TimeRange) bool {
	for _, timeRange := range existing {
		if Overlaps(candidate, timeRange) {
			return true
		}
	}
	return false
}

func IsDateFullyBlocked(blocks []models.ScheduleBlock) bool {
	for _, block := range blocks {
		if IsFullDay(block.StartTime, block.EndTime) {
			return true
		}
	}
	return false
}
