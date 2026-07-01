import { describe, it, expect } from 'vitest';
import { DateUtils } from './date.utils';

describe('DateUtils', () => {
  describe('addDays', () => {
    it('adiciona dias à data', () => {
      const date = new Date(2026, 6, 1);
      const result = DateUtils.addDays(date, 5);
      expect(result.getDate()).toBe(6);
      expect(result.getMonth()).toBe(6);
    });

    it('não muta a data original', () => {
      const date = new Date(2026, 6, 1);
      DateUtils.addDays(date, 3);
      expect(date.getDate()).toBe(1);
    });
  });

  describe('formatToISO', () => {
    it('formata data para YYYY-MM-DD', () => {
      expect(DateUtils.formatToISO(new Date(2026, 0, 5))).toBe('2026-01-05');
    });
  });

  describe('parseISODate', () => {
    it('parseia string ISO', () => {
      const date = DateUtils.parseISODate('2026-07-15');
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(6);
      expect(date.getDate()).toBe(15);
    });
  });

  describe('getDayNameShort / getMonthNameShort', () => {
    it('retorna nomes curtos em português', () => {
      const date = DateUtils.parseISODate('2026-07-01'); // quarta
      expect(DateUtils.getDayNameShort(date)).toBe('Qua');
      expect(DateUtils.getMonthNameShort(date)).toBe('Jul');
    });
  });

  describe('formatToLongBrazilian', () => {
    it('formata data longa brasileira', () => {
      expect(DateUtils.formatToLongBrazilian('2026-07-01')).toBe('Qua, 1 Jul 2026');
    });
  });

  describe('formatTodayHeader', () => {
    it('retorna cabeçalho com Hoje', () => {
      const result = DateUtils.formatTodayHeader();
      expect(result.startsWith('Hoje,')).toBe(true);
    });
  });

  describe('toDateTime', () => {
    it('combina data ISO e horário', () => {
      const dt = DateUtils.toDateTime('2026-07-01', '14:30');
      expect(dt.getHours()).toBe(14);
      expect(dt.getMinutes()).toBe(30);
    });

    it('trata horário sem minutos', () => {
      const dt = DateUtils.toDateTime('2026-07-01', '09');
      expect(dt.getHours()).toBe(9);
      expect(dt.getMinutes()).toBe(0);
    });
  });
});
