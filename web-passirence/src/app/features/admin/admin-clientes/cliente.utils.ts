import { Cliente } from './models/cliente.model';

export function getClienteInitials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatPhoneDisplay(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  if (d.length === 13 && d.startsWith('55')) {
    return `+55 (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  }
  return phone;
}

export function matchesClienteSearch(cliente: Cliente, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const digits = q.replace(/\D/g, '');
  const phoneDigits = cliente.telefone.replace(/\D/g, '');
  if (digits && phoneDigits.includes(digits)) return true;
  return cliente.nome.toLowerCase().includes(q);
}

export function formatAppointmentStatus(status: string): string {
  const map: Record<string, string> = {
    scheduled: 'Agendado',
    cancelled: 'Cancelado',
    canceled: 'Cancelado',
    completed: 'Concluído',
    finished: 'Finalizado',
    confirmed: 'Confirmado',
  };
  return map[status] ?? status;
}

export function formatAppointmentDate(date: string): string {
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
}
