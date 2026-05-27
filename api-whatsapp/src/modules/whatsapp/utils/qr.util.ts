import QRCode from 'qrcode';
import { logger } from '../../../shared/logger/index.js';

export async function qrStringToDataUrl(qr: string): Promise<string> {
  try {
    return await QRCode.toDataURL(qr, {
      margin: 1,
      width: 256,
      errorCorrectionLevel: 'M',
    });
  } catch (error) {
    logger.error({ error }, 'Falha ao gerar imagem do QR Code');
    throw error;
  }
}
