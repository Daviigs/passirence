export interface ClientAppointment {
  id: number;
  clientId: number;
  professionalId: number;
  professionalName?: string;
  serviceIds: number[];
  date: string;
  startTime: string;
  endTime: string;
  status: string;
}
