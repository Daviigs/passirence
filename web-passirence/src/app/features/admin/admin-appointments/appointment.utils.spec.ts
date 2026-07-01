import { describe, it, expect } from 'vitest';
import {
  timeToMinutes,
  minutesToTime,
  statusBadgeClass,
  cardAccentClass,
  buildTimeSlots,
  getEventTopPercent,
  getEventHeightPercent,
  layoutCalendarEvents,
  matchesSearch,
  matchesStatusFilter,
  isAppointmentEditable,
  isTerminalStatus,
  buildDaySummary,
  blockAppliesToDate,
  formatPhoneDisplay,
} from './appointment.utils';
import { AppointmentCalendarEvent } from './models/appointment-view.model';
import { ScheduleBlock } from '../schedule-blocks/models/schedule-block.model';

describe('appointment.utils', () => {
  describe('timeToMinutes / minutesToTime', () => {
    it('converte horário para minutos e vice-versa', () => {
      expect(timeToMinutes('14:30')).toBe(870);
      expect(minutesToTime(870)).toBe('14:30');
    });
  });

  describe('statusBadgeClass', () => {
    it('retorna classes por status', () => {
      expect(statusBadgeClass('completed')).toContain('0066ff');
      expect(statusBadgeClass('scheduled')).toContain('green');
      expect(statusBadgeClass('cancelled')).toContain('red');
      expect(statusBadgeClass('unknown')).toContain('green');
    });
  });

  describe('cardAccentClass', () => {
    it('retorna borda por status', () => {
      expect(cardAccentClass('completed')).toContain('0066ff');
      expect(cardAccentClass('cancelled')).toContain('red');
      expect(cardAccentClass('scheduled')).toContain('green');
    });
  });

  describe('buildTimeSlots', () => {
    it('gera slots no intervalo', () => {
      const slots = buildTimeSlots('08:00', '10:00', 30);
      expect(slots.map((s: { label: string }) => s.label)).toEqual(['08:00', '08:30', '09:00', '09:30']);
    });
  });

  describe('getEventTopPercent / getEventHeightPercent', () => {
    it('calcula posição e altura do evento', () => {
      expect(getEventTopPercent('10:00', 480, 1080)).toBe(20);
      expect(getEventHeightPercent('10:00', '11:00', 480, 1080)).toBeCloseTo(10, 1);
    });

    it('retorna fallback quando range inválido', () => {
      expect(getEventTopPercent('10:00', 600, 600)).toBe(0);
      expect(getEventHeightPercent('10:00', '11:00', 600, 600)).toBe(4);
    });
  });

  describe('layoutCalendarEvents', () => {
    const base = {
      clientId: 1,
      professionalId: 1,
      serviceIds: [1],
      date: '2026-07-01',
      clientName: 'Cliente',
      clientPhone: '11999999999',
      serviceLabel: 'Serviço',
      professionalName: 'Prof',
      statusLabel: 'Agendado',
      services: ['Serviço'],
      serviceItems: [{ id: 1, name: 'Serviço' }],
    } as const;

    it('evento único ocupa largura total', () => {
      const events: AppointmentCalendarEvent[] = [
        { ...base, id: 1, status: 'scheduled', startTime: '10:00', endTime: '11:00' },
      ];
      const layout = layoutCalendarEvents(events).get(1)!;
      expect(layout.leftPercent).toBe(0);
      expect(layout.widthPercent).toBe(100);
    });

    it('dois eventos no mesmo horário ficam lado a lado', () => {
      const events: AppointmentCalendarEvent[] = [
        { ...base, id: 1, status: 'cancelled', startTime: '10:00', endTime: '11:00' },
        { ...base, id: 2, status: 'scheduled', startTime: '10:00', endTime: '11:00' },
      ];
      const layouts = layoutCalendarEvents(events);
      expect(layouts.get(1)).toEqual({ leftPercent: 0, widthPercent: 50 });
      expect(layouts.get(2)).toEqual({ leftPercent: 50, widthPercent: 50 });
    });

    it('três eventos no mesmo horário dividem em três colunas', () => {
      const events: AppointmentCalendarEvent[] = [
        { ...base, id: 1, status: 'scheduled', startTime: '10:00', endTime: '11:00' },
        { ...base, id: 2, status: 'cancelled', startTime: '10:00', endTime: '11:00' },
        { ...base, id: 3, status: 'completed', startTime: '10:00', endTime: '11:00' },
      ];
      const layouts = layoutCalendarEvents(events);
      expect(layouts.get(1)).toEqual({ leftPercent: 0, widthPercent: 100 / 3 });
      expect(layouts.get(2)).toEqual({ leftPercent: 100 / 3, widthPercent: 100 / 3 });
      expect(layouts.get(3)).toEqual({ leftPercent: (100 / 3) * 2, widthPercent: 100 / 3 });
    });

    it('eventos com durações diferentes no mesmo início compartilham colunas', () => {
      const events: AppointmentCalendarEvent[] = [
        { ...base, id: 1, status: 'scheduled', startTime: '10:00', endTime: '12:00' },
        { ...base, id: 2, status: 'cancelled', startTime: '10:00', endTime: '11:00' },
      ];
      const layouts = layoutCalendarEvents(events);
      expect(layouts.get(1)).toEqual({ leftPercent: 0, widthPercent: 50 });
      expect(layouts.get(2)).toEqual({ leftPercent: 50, widthPercent: 50 });
    });

    it('eventos sem sobreposição mantêm largura total', () => {
      const events: AppointmentCalendarEvent[] = [
        { ...base, id: 1, status: 'scheduled', startTime: '09:00', endTime: '10:00' },
        { ...base, id: 2, status: 'cancelled', startTime: '10:00', endTime: '11:00' },
      ];
      const layouts = layoutCalendarEvents(events);
      expect(layouts.get(1)).toEqual({ leftPercent: 0, widthPercent: 100 });
      expect(layouts.get(2)).toEqual({ leftPercent: 0, widthPercent: 100 });
    });
  });

  describe('matchesSearch', () => {
    const event: AppointmentCalendarEvent = {
      id: 1,
      clientId: 10,
      professionalId: 20,
      serviceIds: [1],
      date: '2026-07-01',
      clientName: 'João Silva',
      clientPhone: '11999998888',
      serviceLabel: 'Corte',
      professionalName: 'Carlos',
      status: 'scheduled',
      statusLabel: 'Agendado',
      startTime: '10:00',
      endTime: '11:00',
      services: ['Corte'],
      serviceItems: [{ id: 1, name: 'Corte' }],
    };

    it('retorna true para query vazia', () => {
      expect(matchesSearch(event, '  ')).toBe(true);
    });

    it('busca por nome, serviço, profissional e telefone', () => {
      expect(matchesSearch(event, 'joão')).toBe(true);
      expect(matchesSearch(event, 'corte')).toBe(true);
      expect(matchesSearch(event, 'carlos')).toBe(true);
      expect(matchesSearch(event, '99999')).toBe(true);
      expect(matchesSearch(event, 'inexistente')).toBe(false);
    });
  });

  describe('matchesStatusFilter', () => {
    it('filtra por status normalizado', () => {
      expect(matchesStatusFilter('confirmed', 'all')).toBe(true);
      expect(matchesStatusFilter('confirmed', 'scheduled')).toBe(true);
      expect(matchesStatusFilter('finished', 'completed')).toBe(true);
      expect(matchesStatusFilter('scheduled', 'cancelled')).toBe(false);
    });
  });

  describe('isAppointmentEditable / isTerminalStatus', () => {
    it('delega para core models', () => {
      expect(isAppointmentEditable('scheduled')).toBe(true);
      expect(isTerminalStatus('completed')).toBe(true);
    });
  });

  describe('buildDaySummary', () => {
    it('conta eventos por status', () => {
      const events: AppointmentCalendarEvent[] = [
        { id: 1, status: 'scheduled' } as AppointmentCalendarEvent,
        { id: 2, status: 'completed' } as AppointmentCalendarEvent,
        { id: 3, status: 'cancelled' } as AppointmentCalendarEvent,
      ];
      const summary = buildDaySummary(events);
      expect(summary.total).toBe(3);
      expect(summary.scheduled).toBe(1);
      expect(summary.completed).toBe(1);
      expect(summary.active).toBe(1);
    });
  });

  describe('blockAppliesToDate', () => {
    it('aplica bloqueio recorrente pelo weekday', () => {
      const block: ScheduleBlock = {
        id: 1,
        type: 'DAY_OFF',
        isRecurring: true,
        weekDay: 3,
        startTime: '00:00',
        endTime: '23:59',
        reason: '',
      };
      expect(blockAppliesToDate(block, '2026-07-01')).toBe(true); // quarta
      expect(blockAppliesToDate(block, '2026-07-02')).toBe(false);
    });

    it('aplica bloqueio avulso pela data', () => {
      const block: ScheduleBlock = {
        id: 1,
        type: 'CUSTOM_BLOCK',
        isRecurring: false,
        date: '2026-07-15',
        startTime: '12:00',
        endTime: '13:00',
        reason: '',
      };
      expect(blockAppliesToDate(block, '2026-07-15')).toBe(true);
      expect(blockAppliesToDate(block, '2026-07-16')).toBe(false);
    });
  });

  describe('formatPhoneDisplay', () => {
    it('formata celular e fixo', () => {
      expect(formatPhoneDisplay('11999998888')).toBe('(11) 99999-8888');
      expect(formatPhoneDisplay('1133334444')).toBe('(11) 3333-4444');
    });

    it('retorna original se formato desconhecido', () => {
      expect(formatPhoneDisplay('123')).toBe('123');
    });
  });
});
