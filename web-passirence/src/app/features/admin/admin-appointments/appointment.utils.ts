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
  const map: Record<string, string> = {
    scheduled: 'Agendado',
    confirmed: 'Confirmado',
    pending: 'Pendente',
    cancelled: 'Cancelado',
    canceled: 'Cancelado',
    completed: 'Finalizado',
    finished: 'Finalizado',
  };
  return map[status] ?? status;
}

export function statusBadgeClass(status: string): string {
  if (status === 'completed' || status === 'finished') {
    return 'bg-[#0066ff]/15 text-[#0066ff] border-[#0066ff]/35';
  }
  if (status === 'confirmed' || status === 'scheduled') {
    return 'bg-green-500/15 text-green-400 border-green-500/30';
  }
  if (status === 'pending') return 'bg-yellow-600/15 text-yellow-600 border-yellow-600/30';
  if (status === 'cancelled' || status === 'canceled') {
    return 'bg-red-500/15 text-red-400 border-red-400/30';
  }
  return 'bg-white/10 text-white/60 border-white/10';
}

export function cardAccentClass(status: string): string {
  if (status === 'completed' || status === 'finished') return 'border-l-[#0066ff]';
  if (status === 'pending') return 'border-l-yellow-600';
  if (status === 'cancelled' || status === 'canceled') return 'border-l-red-400';
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
  if (filter === 'cancelled') return status === 'cancelled' || status === 'canceled';
  if (filter === 'scheduled') return status === 'scheduled' || status === 'confirmed';
  if (filter === 'completed') return status === 'finished' || status === 'completed';
  return status === filter;
}

export function isAppointmentEditable(status: string): boolean {
  return status !== 'cancelled' && status !== 'canceled' && status !== 'finished' && status !== 'completed';
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
