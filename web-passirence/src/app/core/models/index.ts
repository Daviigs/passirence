export type { Service } from './service.model';
export type { Professional } from './professional.model';
export type { AppointmentData } from './appointment.model';
export type { Client } from './client.model';
export type {
  CreateAppointmentPayload,
  UpdateAppointmentPayload,
  AppointmentCreated,
  AppointmentListFilters,
} from './appointment-request.model';
export type { AdminAppointment, AppointmentServiceItem } from './admin-appointment.model';
export type { AppointmentStatus } from './appointment-status';
export {
  normalizeAppointmentStatus,
  formatAppointmentStatusLabel,
  isAppointmentEditable,
  isTerminalAppointmentStatus,
} from './appointment-status';
export type { ClientAppointment } from './client-appointment.model';
export type { ApiResponse } from './api-response.model';
export type {
  WhatsappApiStatus,
  WhatsappConnectionStatus,
  WhatsappUiStatus,
} from './whatsapp-status.model';
