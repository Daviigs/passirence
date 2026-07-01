import { describe, expect, it } from 'vitest';
import {
  appointmentCancelSchema,
  appointmentConfirmationSchema,
  sendMessageSchema,
} from './messages.validator.js';

describe('messages.validator', () => {
  describe('sendMessageSchema', () => {
    it('aceita payload válido', () => {
      const result = sendMessageSchema.safeParse({
        phone: '11999998888',
        message: 'Olá',
      });
      expect(result.success).toBe(true);
    });

    it('rejeita telefone curto', () => {
      const result = sendMessageSchema.safeParse({ phone: '123', message: 'Olá' });
      expect(result.success).toBe(false);
    });

    it('rejeita mensagem vazia', () => {
      const result = sendMessageSchema.safeParse({ phone: '11999998888', message: '   ' });
      expect(result.success).toBe(false);
    });

    it('rejeita telefone ausente', () => {
      const result = sendMessageSchema.safeParse({ message: 'Olá' });
      expect(result.success).toBe(false);
    });
  });

  describe('appointmentConfirmationSchema', () => {
    it('aceita confirmação válida', () => {
      const result = appointmentConfirmationSchema.safeParse({
        phone: '11999998888',
        clientName: 'João',
        service: 'Corte',
        date: '01/07/2026',
        time: '10:00',
        totalPrice: 50,
      });
      expect(result.success).toBe(true);
    });

    it('coerce totalPrice de string', () => {
      const result = appointmentConfirmationSchema.safeParse({
        phone: '11999998888',
        clientName: 'João',
        service: 'Corte',
        date: '01/07/2026',
        time: '10:00',
        totalPrice: '75.5',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalPrice).toBe(75.5);
      }
    });

    it('rejeita totalPrice negativo', () => {
      const result = appointmentConfirmationSchema.safeParse({
        phone: '11999998888',
        clientName: 'João',
        service: 'Corte',
        date: '01/07/2026',
        time: '10:00',
        totalPrice: -1,
      });
      expect(result.success).toBe(false);
    });

    it('rejeita campos obrigatórios ausentes', () => {
      const result = appointmentConfirmationSchema.safeParse({ phone: '11999998888' });
      expect(result.success).toBe(false);
    });
  });

  describe('appointmentCancelSchema', () => {
    it('aceita cancelamento válido', () => {
      const result = appointmentCancelSchema.safeParse({
        phone: '11999998888',
        clientName: 'João',
        service: 'Corte',
        date: '01/07/2026',
        time: '10:00',
      });
      expect(result.success).toBe(true);
    });
  });
});
