import type { WASocket } from '@whiskeysockets/baileys';
import { logger } from '../../../shared/logger/index.js';

const DEFAULT_COUNTRY_CODE = '55';

/**
 * Gera candidatos E.164 para números brasileiros (com/sem nono dígito).
 * Ex.: 81981478717 → [5581981478717, 558181478717]
 */
export function getBrazilianPhoneCandidates(digits: string): string[] {
  const normalized = digits.replace(/\D/g, '');
  const candidates = new Set<string>();

  if (!normalized) {
    return [];
  }

  if (normalized.startsWith(DEFAULT_COUNTRY_CODE) && normalized.length >= 12) {
    candidates.add(normalized);
    const local = normalized.slice(2);

    if (local.length === 11) {
      const ddd = local.slice(0, 2);
      const rest = local.slice(2);
      if (rest.startsWith('9') && rest.length === 9) {
        candidates.add(`${DEFAULT_COUNTRY_CODE}${ddd}${rest.slice(1)}`);
      }
    }

    if (local.length === 10) {
      const ddd = local.slice(0, 2);
      const rest = local.slice(2);
      candidates.add(`${DEFAULT_COUNTRY_CODE}${ddd}9${rest}`);
    }

    return [...candidates];
  }

  if (normalized.length === 11) {
    const ddd = normalized.slice(0, 2);
    const rest = normalized.slice(2);
    candidates.add(`${DEFAULT_COUNTRY_CODE}${normalized}`);

    if (rest.startsWith('9') && rest.length === 9) {
      candidates.add(`${DEFAULT_COUNTRY_CODE}${ddd}${rest.slice(1)}`);
    }

    return [...candidates];
  }

  if (normalized.length === 10) {
    const ddd = normalized.slice(0, 2);
    const rest = normalized.slice(2);
    candidates.add(`${DEFAULT_COUNTRY_CODE}${normalized}`);
    candidates.add(`${DEFAULT_COUNTRY_CODE}${ddd}9${rest}`);
    return [...candidates];
  }

  if (normalized.length > 11) {
    candidates.add(normalized);
  }

  return [...candidates];
}

/**
 * Normaliza telefone brasileiro para JID (primeiro candidato válido).
 */
export function normalizePhoneToJid(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.length < 10) {
    throw new Error('Telefone inválido: número muito curto');
  }

  const candidates = getBrazilianPhoneCandidates(digits);
  const e164 = candidates[0];

  if (!e164 || !/^\d{12,15}$/.test(e164)) {
    throw new Error('Telefone inválido: formato incorreto');
  }

  return `${e164}@s.whatsapp.net`;
}

/**
 * Resolve o JID correto via WhatsApp (onWhatsApp), tentando variações do número BR.
 */
export async function resolvePhoneToJid(
  socket: WASocket,
  phone: string,
): Promise<string> {
  const digits = phone.replace(/\D/g, '');

  if (digits.length < 10) {
    throw new Error('Telefone inválido: número muito curto');
  }

  const candidates = getBrazilianPhoneCandidates(digits);

  if (candidates.length === 0) {
    throw new Error('Telefone inválido: formato incorreto');
  }

  try {
    const results = await socket.onWhatsApp(...candidates);

    if (results?.length) {
      for (const candidate of candidates) {
        const match = results.find((item) => {
          const itemDigits = item.jid.replace(/\D/g, '').split(':')[0] ?? '';
          return item.exists && itemDigits === candidate;
        });

        if (match) {
          const jid = match.jid.includes('@') ? match.jid : `${match.jid}@s.whatsapp.net`;
          if (jid !== `${candidates[0]}@s.whatsapp.net`) {
            logger.info(
              { input: phone, resolved: jid, candidates },
              'Telefone resolvido via onWhatsApp',
            );
          }
          return jid;
        }
      }

      const firstExisting = results.find((item) => item.exists);
      if (firstExisting) {
        const jid = firstExisting.jid.includes('@')
          ? firstExisting.jid
          : `${firstExisting.jid}@s.whatsapp.net`;
        logger.info({ input: phone, resolved: jid }, 'Telefone resolvido via onWhatsApp');
        return jid;
      }
    }
  } catch (error) {
    logger.warn({ error, phone, candidates }, 'onWhatsApp falhou, usando normalização local');
  }

  return normalizePhoneToJid(phone);
}

export function extractPhoneFromJid(jid: string): string | null {
  const match = /^(\d+)@/.exec(jid);
  return match?.[1] ?? null;
}

export function isValidJid(jid: string): boolean {
  return /^\d{10,15}@s\.whatsapp\.net$/.test(jid);
}
