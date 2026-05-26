export interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  ativo: boolean;
}

export interface CreateClienteDTO {
  nome: string;
  telefone: string;
  ativo: boolean;
}

export type UpdateClienteDTO = CreateClienteDTO;

export interface ClienteAppointment {
  id: number;
  clientId: number;
  professionalId: number;
  serviceIds: number[];
  date: string;
  startTime: string;
  endTime: string;
  status: string;
}

export interface ClienteAppointmentView extends ClienteAppointment {
  professionalName: string;
  serviceLabel: string;
  statusLabel: string;
}

export type ClienteStatusFilter = 'all' | 'active' | 'inactive';
