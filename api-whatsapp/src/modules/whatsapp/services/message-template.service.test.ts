import { describe, expect, it } from 'vitest';
import {
  buildAppointmentCancelMessage,
  buildAppointmentConfirmationMessage,
  buildAppointmentReminderMessage,
} from './message-template.service.js';

describe('message-template.service', () => {
  it('monta mensagem de confirmação', () => {
    const message = buildAppointmentConfirmationMessage({
      clientName: 'João',
      service: 'Corte + Barba',
      date: '01/07/2026',
      time: '10:00',
      totalPrice: 80,
    });

    expect(message).toContain('Agendamento Confirmado');
    expect(message).toContain('João');
    expect(message).toContain('Corte + Barba');
    expect(message).toContain('01/07/2026');
    expect(message).toContain('10:00');
    expect(message).toMatch(/R\$\s?80/);
  });

  it('monta mensagem de cancelamento', () => {
    const message = buildAppointmentCancelMessage({
      clientName: 'Maria',
      service: 'Barba',
      date: '02/07/2026',
      time: '15:30',
    });

    expect(message).toContain('Agendamento Cancelado');
    expect(message).toContain('Maria');
    expect(message).toContain('Barba');
  });

  it('monta mensagem de lembrete', () => {
    const message = buildAppointmentReminderMessage({
      clientName: 'Pedro',
      service: 'Corte',
      date: '03/07/2026',
      time: '09:00',
    });

    expect(message).toContain('Lembrete');
    expect(message).toContain('Pedro');
    expect(message).toContain('09:00');
  });
});
