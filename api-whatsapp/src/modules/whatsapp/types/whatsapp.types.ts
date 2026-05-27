export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'qr_pending'
  | 'logged_out';

export interface WhatsAppStatus {
  status: ConnectionStatus;
  connected: boolean;
  phoneNumber: string | null;
  profileName: string | null;
  qrCode: string | null;
}

export interface HealthStatus {
  api: 'ok';
  whatsapp: ConnectionStatus;
  phoneNumber: string | null;
}

export interface SendMessagePayload {
  phone: string;
  message: string;
}

export interface AppointmentMessagePayload {
  phone: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
}
