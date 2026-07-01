import { describe, expect, it, vi } from 'vitest';
import {
  extractPhoneFromJid,
  getBrazilianPhoneCandidates,
  isValidJid,
  normalizePhoneToJid,
  resolvePhoneToJid,
} from './phone.util.js';

describe('phone.util', () => {
  describe('getBrazilianPhoneCandidates', () => {
    it('retorna vazio para entrada vazia', () => {
      expect(getBrazilianPhoneCandidates('')).toEqual([]);
      expect(getBrazilianPhoneCandidates('abc')).toEqual([]);
    });

    it('gera candidatos para celular 11 dígitos', () => {
      const candidates = getBrazilianPhoneCandidates('11999998888');
      expect(candidates).toContain('5511999998888');
    });

    it('gera variação sem nono dígito para celular BR', () => {
      const candidates = getBrazilianPhoneCandidates('11999998888');
      expect(candidates).toContain('551199998888');
    });

    it('gera candidatos para fixo 10 dígitos', () => {
      const candidates = getBrazilianPhoneCandidates('1133334444');
      expect(candidates).toContain('551133334444');
      expect(candidates).toContain('5511933334444');
    });

    it('aceita número já com código do país', () => {
      const candidates = getBrazilianPhoneCandidates('5511999998888');
      expect(candidates).toContain('5511999998888');
    });

    it('aceita números longos com código do país', () => {
      const candidates = getBrazilianPhoneCandidates('5514155552671');
      expect(candidates).toContain('5514155552671');
    });
  });

  describe('normalizePhoneToJid', () => {
    it('normaliza telefone válido para JID', () => {
      expect(normalizePhoneToJid('11999998888')).toBe('5511999998888@s.whatsapp.net');
    });

    it('lança erro para telefone curto', () => {
      expect(() => normalizePhoneToJid('123')).toThrow('número muito curto');
    });

    it('lança erro para telefone com formato inválido após normalização', () => {
      expect(() => normalizePhoneToJid('123456789')).toThrow('Telefone inválido');
    });
  });

  describe('extractPhoneFromJid / isValidJid', () => {
    it('extrai telefone do JID', () => {
      expect(extractPhoneFromJid('5511999998888@s.whatsapp.net')).toBe('5511999998888');
    });

    it('retorna null para JID inválido', () => {
      expect(extractPhoneFromJid('invalid')).toBeNull();
    });

    it('valida JID pessoal', () => {
      expect(isValidJid('5511999998888@s.whatsapp.net')).toBe(true);
      expect(isValidJid('abc@s.whatsapp.net')).toBe(false);
    });
  });

  describe('resolvePhoneToJid', () => {
    it('retorna JID confirmado via onWhatsApp', async () => {
      const socket = {
        onWhatsApp: vi.fn().mockResolvedValue([
          { exists: true, jid: '5511999998888@s.whatsapp.net' },
        ]),
      };

      const jid = await resolvePhoneToJid(socket as never, '11999998888');
      expect(jid).toBe('5511999998888@s.whatsapp.net');
    });

    it('lança erro quando onWhatsApp não encontra o número', async () => {
      const socket = {
        onWhatsApp: vi.fn().mockResolvedValue([{ exists: false, jid: '5511999998888@s.whatsapp.net' }]),
      };

      await expect(resolvePhoneToJid(socket as never, '11999998888')).rejects.toThrow(
        'Telefone não encontrado no WhatsApp',
      );
    });

    it('lança erro quando onWhatsApp falha', async () => {
      const socket = {
        onWhatsApp: vi.fn().mockRejectedValue(new Error('network error')),
      };

      await expect(resolvePhoneToJid(socket as never, '11999998888')).rejects.toThrow(
        'Não foi possível confirmar o número no WhatsApp',
      );
    });

    it('usa JID da sessão quando destino é o próprio número conectado', async () => {
      const socket = {
        user: { id: '5511999998888:64@s.whatsapp.net' },
        onWhatsApp: vi.fn(),
      };

      const jid = await resolvePhoneToJid(socket as never, '11999998888');
      expect(jid).toBe('5511999998888@s.whatsapp.net');
      expect(socket.onWhatsApp).not.toHaveBeenCalled();
    });
  });
});
