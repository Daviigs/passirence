import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppointmentsApiService } from '../../../core/services';
import { ClienteAppointmentView } from './models/cliente.model';
import { formatAppointmentStatus } from './cliente.utils';

@Injectable({ providedIn: 'root' })
export class ClienteAppointmentService {
  private readonly appointmentsApi = inject(AppointmentsApiService);

  getHistoryByClientId(clientId: number): Observable<ClienteAppointmentView[]> {
    return this.appointmentsApi.list({ clientId }).pipe(
      map((items) =>
        items
          .map((item) => ({
            id: item.id,
            clientId: item.clientId,
            professionalId: item.professionalId,
            serviceIds: item.serviceIds,
            date: item.date,
            startTime: item.startTime,
            endTime: item.endTime,
            status: item.status,
            professionalName: item.professionalName ?? `Prof. #${item.professionalId}`,
            serviceLabel: item.services.join(', ') || '—',
            statusLabel: formatAppointmentStatus(item.status),
          }))
          .sort((a, b) => `${b.date}T${b.startTime}`.localeCompare(`${a.date}T${a.startTime}`)),
      ),
    );
  }

  getLastAppointmentLabel(clientId: number): Observable<string> {
    return this.getHistoryByClientId(clientId).pipe(
      map((items) => {
        if (items.length === 0) return '—';
        const last = items[0];
        const time = last.startTime?.slice(0, 5) ?? '';
        return `${last.date.split('-').reverse().join('/')} ${time}`;
      }),
    );
  }
}
