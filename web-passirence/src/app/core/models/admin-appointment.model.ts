import type { AppointmentStatus } from './appointment-status';

export interface AppointmentServiceItem {
  id: number;
  name: string;
  durationMinutes?: number;
}

export interface AdminAppointment {
  id: number;
  clientId: number;
  professionalId: number;
  serviceIds: number[];
  date: string;
  status: AppointmentStatus;
  startTime: string;
  endTime: string;
  professionalName?: string;
  clientName: string;
  clientPhone: string;
  services: string[];
  serviceItems: AppointmentServiceItem[];
}
