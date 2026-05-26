export interface CreateAppointmentPayload {
  clientId: number;
  professionalId: number;
  serviceIds: number[];
  date: string;
  startTime: string;
}

export interface UpdateAppointmentPayload {
  clientId: number;
  professionalId: number;
  serviceIds: number[];
  date: string;
  startTime: string;
  status?: string;
}

export interface AppointmentCreated {
  id: number;
  clientId: number;
  professionalId: number;
  serviceIds: number[];
  date: string;
  startTime: string;
  endTime?: string;
  status?: string;
}

export interface AppointmentListFilters {
  date?: string;
  professionalId?: number;
  clientId?: number;
  status?: string;
}
