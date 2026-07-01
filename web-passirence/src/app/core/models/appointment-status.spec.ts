import { describe, it, expect } from 'vitest';
import {
  normalizeAppointmentStatus,
  formatAppointmentStatusLabel,
  isAppointmentEditable,
  isTerminalAppointmentStatus,
  APPOINTMENT_STATUSES,
} from './appointment-status';

describe('appointment-status', () => {
  describe('normalizeAppointmentStatus', () => {
    it('normaliza status legados para scheduled', () => {
      expect(normalizeAppointmentStatus('confirmed')).toBe('scheduled');
      expect(normalizeAppointmentStatus('pending')).toBe('scheduled');
      expect(normalizeAppointmentStatus('agendado')).toBe('scheduled');
    });

    it('normaliza status legados para completed', () => {
      expect(normalizeAppointmentStatus('finished')).toBe('completed');
      expect(normalizeAppointmentStatus('finalizado')).toBe('completed');
    });

    it('normaliza status legados para cancelled', () => {
      expect(normalizeAppointmentStatus('canceled')).toBe('cancelled');
      expect(normalizeAppointmentStatus('no_show')).toBe('cancelled');
    });

    it('retorna scheduled para null/undefined/vazio/desconhecido', () => {
      expect(normalizeAppointmentStatus(null)).toBe('scheduled');
      expect(normalizeAppointmentStatus(undefined)).toBe('scheduled');
      expect(normalizeAppointmentStatus('')).toBe('scheduled');
      expect(normalizeAppointmentStatus('xyz')).toBe('scheduled');
    });
  });

  describe('formatAppointmentStatusLabel', () => {
    it('formata labels em português', () => {
      expect(formatAppointmentStatusLabel('scheduled')).toBe('Agendado');
      expect(formatAppointmentStatusLabel('finished')).toBe('Concluído');
      expect(formatAppointmentStatusLabel('cancelado')).toBe('Cancelado');
    });
  });

  describe('isAppointmentEditable', () => {
    it('apenas scheduled é editável', () => {
      expect(isAppointmentEditable('scheduled')).toBe(true);
      expect(isAppointmentEditable('completed')).toBe(false);
      expect(isAppointmentEditable('cancelled')).toBe(false);
    });
  });

  describe('isTerminalAppointmentStatus', () => {
    it('identifica status terminais', () => {
      expect(isTerminalAppointmentStatus('completed')).toBe(true);
      expect(isTerminalAppointmentStatus('scheduled')).toBe(false);
    });
  });

  describe('APPOINTMENT_STATUSES', () => {
    it('contém os 3 status oficiais', () => {
      expect(APPOINTMENT_STATUSES).toEqual(['scheduled', 'completed', 'cancelled']);
    });
  });
});
