import {
  formatAppointmentStatusLabel,
  isAppointmentEditable as coreIsAppointmentEditable,
  isTerminalAppointmentStatus,
  normalizeAppointmentStatus,
} from '../../../core/models/appointment-status';
import { AppointmentCalendarEvent } from './models/appointment-view.model';
import { ScheduleBlock } from '../schedule-blocks/models/schedule-block.model';
import { DateUtils } from '../../../core/utils';

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m ?? 0);
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatAppointmentStatus(status: string): string {
  return formatAppointmentStatusLabel(status);
}

export function statusBadgeClass(status: string): string {
  const normalized = normalizeAppointmentStatus(status);
  if (normalized === 'completed') {
    return 'bg-[#0066ff]/15 text-[#6eb5ff] border-[#0066ff]/35';
  }
  if (normalized === 'scheduled') {
    return 'bg-green-500/15 text-green-400 border-green-500/30';
  }
  if (normalized === 'cancelled') {
    return 'bg-red-500/15 text-red-400 border-red-400/30';
  }
  return 'bg-white/10 text-white/60 border-white/10';
}

export function cardAccentClass(status: string): string {
  const normalized = normalizeAppointmentStatus(status);
  if (normalized === 'completed') return 'border-l-[#0066ff]';
  if (normalized === 'cancelled') return 'border-l-red-400';
  return 'border-l-green-500';
}

export function buildTimeSlots(openTime: string, closeTime: string, intervalMinutes: number): { label: string; minutes: number }[] {
  const start = timeToMinutes(openTime);
  const end = timeToMinutes(closeTime);
  const slots: { label: string; minutes: number }[] = [];
  for (let m = start; m < end; m += intervalMinutes) {
    slots.push({ label: minutesToTime(m), minutes: m });
  }
  return slots;
}

export function getEventTopPercent(startTime: string, dayStartMinutes: number, dayEndMinutes: number): number {
  const start = timeToMinutes(startTime.slice(0, 5));
  const range = dayEndMinutes - dayStartMinutes;
  if (range <= 0) return 0;
  return ((start - dayStartMinutes) / range) * 100;
}

export function getEventHeightPercent(startTime: string, endTime: string, dayStartMinutes: number, dayEndMinutes: number): number {
  const start = timeToMinutes(startTime.slice(0, 5));
  const end = timeToMinutes(endTime.slice(0, 5));
  const range = dayEndMinutes - dayStartMinutes;
  if (range <= 0) return 4;
  return Math.max(((end - start) / range) * 100, 4);
}

export interface CalendarEventLayout {
  leftPercent: number;
  widthPercent: number;
}

interface TimedLayoutEvent {
  event: AppointmentCalendarEvent;
  start: number;
  end: number;
  column: number;
}

function eventsTimeOverlap(a: { start: number; end: number }, b: { start: number; end: number }): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Distribui eventos sobrepostos lado a lado; status não influencia posição. */
export function layoutCalendarEvents(events: AppointmentCalendarEvent[]): Map<number, CalendarEventLayout> {
  const result = new Map<number, CalendarEventLayout>();
  if (events.length === 0) return result;

  const sorted: TimedLayoutEvent[] = [...events]
    .map((event) => ({
      event,
      start: timeToMinutes(event.startTime.slice(0, 5)),
      end: timeToMinutes(event.endTime.slice(0, 5)),
      column: 0,
    }))
    .sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return b.end - a.end;
    });

  const columns: TimedLayoutEvent[][] = [];

  for (const item of sorted) {
    let placed = false;
    for (let col = 0; col < columns.length; col++) {
      const lastInColumn = columns[col][columns[col].length - 1];
      if (lastInColumn.end <= item.start) {
        columns[col].push(item);
        item.column = col;
        placed = true;
        break;
      }
    }
    if (!placed) {
      item.column = columns.length;
      columns.push([item]);
    }
  }

  for (const item of sorted) {
    const overlapping = sorted.filter((other) => eventsTimeOverlap(item, other));
    const columnsInCluster = Math.max(...overlapping.map((e) => e.column)) + 1;
    const widthPercent = 100 / columnsInCluster;
    result.set(item.event.id, {
      leftPercent: item.column * widthPercent,
      widthPercent,
    });
  }

  return result;
}

export function matchesSearch(event: AppointmentCalendarEvent, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const digits = q.replace(/\D/g, '');
  if (digits && event.clientPhone.replace(/\D/g, '').includes(digits)) return true;
  return (
    event.clientName.toLowerCase().includes(q) ||
    event.serviceLabel.toLowerCase().includes(q) ||
    (event.professionalName?.toLowerCase().includes(q) ?? false)
  );
}

export function matchesStatusFilter(status: string, filter: string): boolean {
  if (filter === 'all') return true;
  return normalizeAppointmentStatus(status) === filter;
}

export function isAppointmentEditable(status: string): boolean {
  return coreIsAppointmentEditable(status);
}

export function isTerminalStatus(status: string): boolean {
  return isTerminalAppointmentStatus(status);
}

export function buildDaySummary(events: AppointmentCalendarEvent[]): {
  total: number;
  active: number;
  scheduled: number;
  completed: number;
} {
  const completed = events.filter((e) => normalizeAppointmentStatus(e.status) === 'completed').length;
  const cancelled = events.filter((e) => normalizeAppointmentStatus(e.status) === 'cancelled').length;
  const scheduled = events.filter((e) => normalizeAppointmentStatus(e.status) === 'scheduled').length;

  return {
    total: events.length,
    active: scheduled,
    scheduled,
    completed,
  };
}

export function blockAppliesToDate(block: ScheduleBlock, isoDate: string): boolean {
  const date = DateUtils.parseISODate(isoDate);
  if (block.isRecurring && block.weekDay !== null && block.weekDay !== undefined) {
    return date.getDay() === block.weekDay;
  }
  return block.date === isoDate;
}

export function formatPhoneDisplay(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}
