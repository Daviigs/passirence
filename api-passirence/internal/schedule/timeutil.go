package schedule

import (
	"fmt"
	"sort"
	"time"
)

const (
	DateLayout = "2006-01-02"
	TimeLayout = "15:04"
)

type TimeRange struct {
	Start int
	End   int
}

func ParseDate(date string, loc *time.Location) (time.Time, error) {
	return time.ParseInLocation(DateLayout, date, loc)
}

func MinutesFromTime(value string) (int, error) {
	t, err := time.Parse(TimeLayout, value)
	if err != nil {
		return 0, fmt.Errorf("horário inválido: %s", value)
	}
	return t.Hour()*60 + t.Minute(), nil
}

func TimeFromMinutes(minutes int) string {
	h := minutes / 60
	m := minutes % 60
	return fmt.Sprintf("%02d:%02d", h, m)
}

func AddMinutesToTime(value string, minutes int) (string, error) {
	start, err := MinutesFromTime(value)
	if err != nil {
		return "", err
	}
	return TimeFromMinutes(start + minutes), nil
}

func Overlaps(a, b TimeRange) bool {
	return a.Start < b.End && b.Start < a.End
}

// GenerateGridSlotStarts retorna horários da grade base (slotInterval).
func GenerateGridSlotStarts(open, close, duration, interval int) []int {
	if duration <= 0 || interval <= 0 || open >= close {
		return nil
	}

	var slots []int
	for start := open; start+duration <= close; start += interval {
		slots = append(slots, start)
	}
	return slots
}

// GenerateSlotStarts mantém compatibilidade com chamadas existentes.
func GenerateSlotStarts(open, close, duration, interval int) []int {
	return GenerateGridSlotStarts(open, close, duration, interval)
}

// ExtractReleaseTimes retorna horários de liberação (End de ranges ocupados).
func ExtractReleaseTimes(busy []TimeRange, open, close, duration int) []int {
	maxStart := close - duration
	if maxStart < open {
		return nil
	}

	releases := make([]int, 0, len(busy))
	seen := make(map[int]struct{}, len(busy))

	for _, timeRange := range busy {
		release := timeRange.End
		if release < open || release > maxStart {
			continue
		}
		if _, exists := seen[release]; exists {
			continue
		}
		seen[release] = struct{}{}
		releases = append(releases, release)
	}

	return releases
}

// MergeCandidateSlots une grade base + liberações dinâmicas sem duplicar.
func MergeCandidateSlots(grid, dynamic []int) []int {
	seen := make(map[int]struct{}, len(grid)+len(dynamic))
	merged := make([]int, 0, len(grid)+len(dynamic))

	for _, slot := range append(grid, dynamic...) {
		if _, exists := seen[slot]; exists {
			continue
		}
		seen[slot] = struct{}{}
		merged = append(merged, slot)
	}

	sort.Ints(merged)
	return merged
}

// BuildAvailabilityCandidates gera candidatos: grade (slotInterval) + fim de ocupações.
func BuildAvailabilityCandidates(open, close, duration, interval int, busy []TimeRange) []int {
	grid := GenerateGridSlotStarts(open, close, duration, interval)
	dynamic := ExtractReleaseTimes(busy, open, close, duration)
	return MergeCandidateSlots(grid, dynamic)
}

func IsSlotAvailable(slotStart, duration int, busy []TimeRange) bool {
	candidate := TimeRange{Start: slotStart, End: slotStart + duration}
	for _, existing := range busy {
		if Overlaps(candidate, existing) {
			return false
		}
	}
	return true
}

func FilterAvailableSlots(slots []int, duration int, busy []TimeRange) []string {
	result := make([]string, 0, len(slots))
	for _, slot := range slots {
		if IsSlotAvailable(slot, duration, busy) {
			result = append(result, TimeFromMinutes(slot))
		}
	}
	return result
}

func ToTimeRanges(startTime, endTime string) (TimeRange, error) {
	start, err := MinutesFromTime(startTime)
	if err != nil {
		return TimeRange{}, err
	}
	end, err := MinutesFromTime(endTime)
	if err != nil {
		return TimeRange{}, err
	}
	return TimeRange{Start: start, End: end}, nil
}
