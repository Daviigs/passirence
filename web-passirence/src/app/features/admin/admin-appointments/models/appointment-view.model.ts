import { AdminAppointment } from '../../../../core/models';

export type AppointmentViewMode = 'day' | 'week';

export type AppointmentStatusFilter =
  | 'all'
  | 'scheduled'
  | 'confirmed'
  | 'pending'
  | 'cancelled'
  | 'completed';

export type AppointmentPeriodFilter = 'today' | 'tomorrow' | 'week' | 'month';

export interface AppointmentFilters {
  professionalId: number | null;
  status: AppointmentStatusFilter;
  period: AppointmentPeriodFilter;
  search: string;
}

export interface AppointmentCalendarEvent extends AdminAppointment {
  serviceLabel: string;
  statusLabel: string;
}

export interface TimeSlotRow {
  label: string;
  minutes: number;
}
