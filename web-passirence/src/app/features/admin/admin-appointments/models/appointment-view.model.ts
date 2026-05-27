import { AdminAppointment } from '../../../../core/models';
import { AppointmentStatus } from '../../../../core/models/appointment-status';

export type AppointmentViewMode = 'day' | 'week';

export type AppointmentStatusFilter = 'all' | AppointmentStatus;

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
