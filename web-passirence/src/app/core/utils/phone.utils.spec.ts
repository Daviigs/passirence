import { describe, it, expect } from 'vitest';
import { PhoneUtils } from './phone.utils';

describe('PhoneUtils', () => {
  describe('extractDigits', () => {
    it('remove caracteres não numéricos', () => {
      expect(PhoneUtils.extractDigits('(11) 99999-8888')).toBe('11999998888');
    });

    it('retorna string vazia para entrada vazia', () => {
      expect(PhoneUtils.extractDigits('')).toBe('');
    });
  });

  describe('formatWhileTyping', () => {
    it('formata progressivamente', () => {
      expect(PhoneUtils.formatWhileTyping('')).toBe('');
      expect(PhoneUtils.formatWhileTyping('11')).toBe('(11');
      expect(PhoneUtils.formatWhileTyping('1199999')).toBe('(11) 99999');
      expect(PhoneUtils.formatWhileTyping('11999998888')).toBe('(11) 99999-8888');
    });
  });

  describe('isValidForSubmit', () => {
    it('aceita telefone com 10 ou 11 dígitos', () => {
      expect(PhoneUtils.isValidForSubmit('(11) 3333-4444')).toBe(true);
      expect(PhoneUtils.isValidForSubmit('(11) 99999-8888')).toBe(true);
    });

    it('rejeita telefone incompleto ou longo demais', () => {
      expect(PhoneUtils.isValidForSubmit('11999')).toBe(false);
      expect(PhoneUtils.isValidForSubmit('5511999998888777')).toBe(false);
    });
  });

  describe('getValidationError', () => {
    it('retorna null para vazio', () => {
      expect(PhoneUtils.getValidationError('')).toBeNull();
    });

    it('retorna erro para incompleto', () => {
      expect(PhoneUtils.getValidationError('11999')).toBe('Telefone incompleto');
    });

    it('retorna erro para longo demais', () => {
      expect(PhoneUtils.getValidationError('5511999998888777')).toBe('Telefone inválido');
    });

    it('retorna null para válido', () => {
      expect(PhoneUtils.getValidationError('11999998888')).toBeNull();
    });
  });

  describe('addCountryCode', () => {
    it('adiciona +55 quando ausente', () => {
      expect(PhoneUtils.addCountryCode('11999998888')).toBe('+5511999998888');
    });

    it('preserva código 55 existente', () => {
      expect(PhoneUtils.addCountryCode('5511999998888')).toBe('+5511999998888');
    });
  });
});
