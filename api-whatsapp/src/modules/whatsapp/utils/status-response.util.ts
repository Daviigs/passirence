import type { WhatsAppStatus } from '../types/index.js';
import { qrStringToDataUrl } from './qr.util.js';

export async function toStatusResponse(status: WhatsAppStatus): Promise<WhatsAppStatus> {
  if (!status.qrCode) {
    return status;
  }

  const qrCode = await qrStringToDataUrl(status.qrCode);
  return { ...status, qrCode };
}
