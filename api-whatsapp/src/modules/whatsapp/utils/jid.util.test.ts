import { describe, expect, it } from 'vitest';
import { isPersonalChatJid, shouldIgnoreJid } from './jid.util.js';

describe('jid.util', () => {
  describe('shouldIgnoreJid', () => {
    it('ignora null/undefined/vazio', () => {
      expect(shouldIgnoreJid(null)).toBe(true);
      expect(shouldIgnoreJid(undefined)).toBe(true);
      expect(shouldIgnoreJid('')).toBe(true);
    });

    it('ignora grupos e broadcast', () => {
      expect(shouldIgnoreJid('123@g.us')).toBe(true);
      expect(shouldIgnoreJid('abc@broadcast')).toBe(true);
      expect(shouldIgnoreJid('status@broadcast')).toBe(true);
    });

    it('não ignora chat pessoal', () => {
      expect(shouldIgnoreJid('5511999998888@s.whatsapp.net')).toBe(false);
    });
  });

  describe('isPersonalChatJid', () => {
    it('identifica chat pessoal', () => {
      expect(isPersonalChatJid('5511999998888@s.whatsapp.net')).toBe(true);
    });

    it('rejeita grupo', () => {
      expect(isPersonalChatJid('123@g.us')).toBe(false);
    });
  });
});
