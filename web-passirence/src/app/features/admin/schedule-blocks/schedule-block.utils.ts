import { ScheduleBlock, ScheduleBlockType } from './models/schedule-block.model';
import { SCHEDULE_BLOCK_TYPE_OPTIONS, WEEKDAY_OPTIONS } from './models/schedule-block.model';

export function getTypeLabel(type: ScheduleBlockType): string {
  return SCHEDULE_BLOCK_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

export function getWeekdayLabel(weekDay: number | null | undefined): string {
  if (weekDay === null || weekDay === undefined) return '—';
  return WEEKDAY_OPTIONS.find((o) => o.value === weekDay)?.label ?? '—';
}

export function formatTimeRange(startTime: string, endTime: string): string {
  const start = startTime?.slice(0, 5) ?? '--:--';
  const end = endTime?.slice(0, 5) ?? '--:--';
  if (isFullDay(start, end)) return 'Dia inteiro';
  return `${start} → ${end}`;
}

export function isFullDay(startTime: string, endTime: string): boolean {
  const start = startTime?.slice(0, 5);
  const end = endTime?.slice(0, 5);
  return start === '00:00' && end === '23:59';
}

export function formatBlockDate(block: ScheduleBlock): string {
  if (block.isRecurring && block.weekDay !== null && block.weekDay !== undefined) {
    return `Toda ${getWeekdayLabel(block.weekDay).replace('-feira', '')}`;
  }
  if (block.date) {
    const [y, m, d] = block.date.split('-');
    return `${d}/${m}/${y}`;
  }
  return '—';
}

export function isEndBeforeStart(startTime: string, endTime: string): boolean {
  if (!startTime || !endTime) return false;
  if (isFullDay(startTime, endTime)) return false;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return eh * 60 + em <= sh * 60 + sm;
}
