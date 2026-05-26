import { Injectable, signal } from '@angular/core';
import { Cliente } from './models/cliente.model';

@Injectable({ providedIn: 'root' })
export class ClientesStoreService {
  private readonly clients = signal<Cliente[]>([]);
  private readonly lastAppointmentByClient = signal<Record<number, string>>({});

  readonly clientsList = this.clients.asReadonly();

  setClients(list: Cliente[]): void {
    this.clients.set(list);
  }

  upsertClient(cliente: Cliente): void {
    this.clients.update((list) => {
      const idx = list.findIndex((c) => c.id === cliente.id);
      if (idx === -1) return [...list, cliente];
      const next = [...list];
      next[idx] = cliente;
      return next;
    });
  }

  removeClient(id: number): void {
    this.clients.update((list) => list.filter((c) => c.id !== id));
  }

  findById(id: number): Cliente | undefined {
    return this.clients().find((c) => c.id === id);
  }

  setLastAppointment(clientId: number, label: string): void {
    this.lastAppointmentByClient.update((map) => ({ ...map, [clientId]: label }));
  }

  getLastAppointment(clientId: number): string {
    return this.lastAppointmentByClient()[clientId] ?? '—';
  }
}
