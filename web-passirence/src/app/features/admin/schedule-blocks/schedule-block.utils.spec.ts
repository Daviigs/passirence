import { describe, it, expect } from 'vitest';
import {
  getTypeLabel,
  getWeekdayLabel,
  formatTimeRange,
  isFullDay,
  formatBlockDate,
  isEndBeforeStart,
} from './schedule-block.utils';
import { ScheduleBlock } from './models/schedule-block.model';

describe('schedule-block.utils', () => {
  describe('getTypeLabel', () => {
    it('retorna label conhecido ou o type bruto', () => {
      expect(getTypeLabel('LUNCH')).toBe('Almoço');
      expect(getTypeLabel('UNKNOWN' as never)).toBe('UNKNOWN');
    });
  });

  describe('getWeekdayLabel', () => {
    it('retorna label ou em-dash', () => {
      expect(getWeekdayLabel(1)).toBe('Segunda-feira');
      expect(getWeekdayLabel(null)).toBe('—');
      expect(getWeekdayLabel(undefined)).toBe('—');
      expect(getWeekdayLabel(99)).toBe('—');
    });
  });

  describe('formatTimeRange', () => {
    it('formata dia inteiro', () => {
      expect(formatTimeRange('00:00', '23:59')).toBe('Dia inteiro');
    });

    it('formata intervalo parcial', () => {
      expect(formatTimeRange('12:00:00', '13:30:00')).toBe('12:00 → 13:30');
    });

    it('usa fallback para horários ausentes', () => {
      expect(formatTimeRange('', '')).toBe(' → ');
    });
  });

  describe('isFullDay', () => {
    it('identifica bloqueio de dia inteiro', () => {
      expect(isFullDay('00:00', '23:59')).toBe(true);
      expect(isFullDay('08:00', '18:00')).toBe(false);
    });
  });

  describe('formatBlockDate', () => {
    it('formata bloqueio recorrente', () => {
      const block: ScheduleBlock = {
        id: 1,
        type: 'DAY_OFF',
        isRecurring: true,
        weekDay: 1,
        startTime: '00:00',
        endTime: '23:59',
        reason: '',
      };
      expect(formatBlockDate(block)).toBe('Toda Segunda');
    });

    it('formata bloqueio avulso', () => {
      const block: ScheduleBlock = {
        id: 1,
        type: 'CUSTOM_BLOCK',
        isRecurring: false,
        date: '2026-07-15',
        startTime: '12:00',
        endTime: '13:00',
        reason: '',
      };
      expect(formatBlockDate(block)).toBe('15/07/2026');
    });

    it('retorna em-dash sem data', () => {
      const block: ScheduleBlock = {
        id: 1,
        type: 'BREAK',
        isRecurring: false,
        startTime: '15:00',
        endTime: '15:30',
        reason: '',
      };
      expect(formatBlockDate(block)).toBe('—');
    });
  });

  describe('isEndBeforeStart', () => {
    it('detecta fim antes ou igual ao início', () => {
      expect(isEndBeforeStart('12:00', '11:00')).toBe(true);
      expect(isEndBeforeStart('12:00', '12:00')).toBe(true);
      expect(isEndBeforeStart('12:00', '13:00')).toBe(false);
    });

    it('ignora dia inteiro e horários vazios', () => {
      expect(isEndBeforeStart('00:00', '23:59')).toBe(false);
      expect(isEndBeforeStart('', '13:00')).toBe(false);
    });
  });
});
