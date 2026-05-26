export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'finished'
  | 'cancelled'
  | 'canceled';

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
  startTime: string;
  endTime: string;
  status: string;
  clientName: string;
  clientPhone: string;
  professionalName?: string;
  services: string[];
  serviceItems?: AppointmentServiceItem[];
}
