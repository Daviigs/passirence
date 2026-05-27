const DEFAULT_COUNTRY_CODE = '55';

/**
 * Normaliza telefone brasileiro para JID do WhatsApp.
 * Ex.: 81999999999, +55 (81) 99999-9999 → 5581999999999@s.whatsapp.net
 */
export function normalizePhoneToJid(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.length < 10) {
    throw new Error('Telefone inválido: número muito curto');
  }

  let normalized = digits;

  if (normalized.length <= 11) {
    normalized = `${DEFAULT_COUNTRY_CODE}${normalized}`;
  }

  if (!/^\d{12,15}$/.test(normalized)) {
    throw new Error('Telefone inválido: formato incorreto');
  }

  return `${normalized}@s.whatsapp.net`;
}

export function extractPhoneFromJid(jid: string): string | null {
  const match = /^(\d+)@/.exec(jid);
  return match?.[1] ?? null;
}

export function isValidJid(jid: string): boolean {
  return /^\d{10,15}@s\.whatsapp\.net$/.test(jid);
}
