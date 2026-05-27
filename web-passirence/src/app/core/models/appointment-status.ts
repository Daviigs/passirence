/** Status oficiais de agendamento. */
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

export const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'scheduled',
  'completed',
  'cancelled',
];

/** Converte status legados da API/DB para um dos 3 oficiais. */
export function normalizeAppointmentStatus(status: string | null | undefined): AppointmentStatus {
  const s = (status ?? '').toLowerCase().trim();
  switch (s) {
    case 'scheduled':
    case 'confirmed':
    case 'in_progress':
    case 'in-progress':
    case 'pending':
    case 'agendado':
    case 'confirmado':
      return 'scheduled';
    case 'completed':
    case 'finished':
    case 'finalizado':
    case 'concluido':
    case 'concluído':
      return 'completed';
    case 'cancelled':
    case 'canceled':
    case 'cancelado':
    case 'no_show':
    case 'no-show':
      return 'cancelled';
    default:
      return 'scheduled';
  }
}

export function formatAppointmentStatusLabel(status: string): string {
  const labels: Record<AppointmentStatus, string> = {
    scheduled: 'Agendado',
    completed: 'Concluído',
    cancelled: 'Cancelado',
  };
  return labels[normalizeAppointmentStatus(status)];
}

export function isAppointmentEditable(status: string): boolean {
  return normalizeAppointmentStatus(status) === 'scheduled';
}

export function isTerminalAppointmentStatus(status: string): boolean {
  return normalizeAppointmentStatus(status) !== 'scheduled';
}
