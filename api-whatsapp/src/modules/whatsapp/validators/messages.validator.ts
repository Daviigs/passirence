import { z } from 'zod';

const phoneSchema = z
  .string({ required_error: 'Telefone é obrigatório' })
  .min(8, 'Telefone inválido')
  .max(20, 'Telefone inválido');

const nonEmptyString = (field: string) =>
  z
    .string({ required_error: `${field} é obrigatório` })
    .trim()
    .min(1, `${field} não pode ser vazio`);

export const sendMessageSchema = z.object({
  phone: phoneSchema,
  message: nonEmptyString('Mensagem'),
});

const appointmentBaseSchema = z.object({
  phone: phoneSchema,
  clientName: nonEmptyString('Nome do cliente'),
  service: nonEmptyString('Serviço'),
  date: nonEmptyString('Data'),
  time: nonEmptyString('Horário'),
});

export const appointmentConfirmationSchema = appointmentBaseSchema.extend({
  totalPrice: z.coerce
    .number({ required_error: 'Valor total é obrigatório' })
    .min(0, 'Valor total inválido'),
});

export const appointmentCancelSchema = appointmentBaseSchema;

/** @deprecated Use appointmentConfirmationSchema */
export const appointmentMessageSchema = appointmentConfirmationSchema;
