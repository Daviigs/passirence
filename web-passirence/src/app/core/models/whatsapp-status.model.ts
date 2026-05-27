export type WhatsappConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'qr_pending'
  | 'logged_out';

export interface WhatsappApiStatus {
  status: WhatsappConnectionStatus;
  connected: boolean;
  phoneNumber: string | null;
  profileName: string | null;
  qrCode: string | null;
}

export interface WhatsappUiStatus {
  connected: boolean;
  hasQRCode: boolean;
  qrCode: string;
  phoneNumber: string | null;
  profileName: string | null;
  status: WhatsappConnectionStatus;
}
