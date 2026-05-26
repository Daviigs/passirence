import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AppointmentsApiService } from '../../../core/services';
import { AdminAppointment } from '../../../core/models';
import { DateUtils } from '../../../core/utils';
import { ProfissionaisService } from '../admin-profissionais/profissionais.service';
import { UpcomingAppointmentItem } from './components/appointments-list/dashboard-appointments-list';

export interface DashboardMetrics {
  appointmentsToday: number;
  activeClientsToday: number;
  activeProfessionals: number;
  servicesPerformedToday: number;
  upcoming: UpcomingAppointmentItem[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly appointmentsApi = inject(AppointmentsApiService);
  private readonly profissionaisService = inject(ProfissionaisService);
  load(): Observable<DashboardMetrics> {
    const todayIso = DateUtils.formatToISO(new Date());

    return forkJoin({
      appointments: this.appointmentsApi.getByDate(todayIso).pipe(catchError(() => of([]))),
      professionals: this.profissionaisService.getProfessionals().pipe(catchError(() => of([]))),
    }).pipe(
      map(({ appointments, professionals }) =>
        this.buildMetrics(appointments, professionals),
      ),
    );
  }

  private buildMetrics(
    appointments: AdminAppointment[],
    professionals: { ativo: boolean }[],
  ): DashboardMetrics {
    const uniqueClients = new Set(
      appointments.map((a) => a.clientName?.trim()).filter(Boolean),
    );

    const servicesPerformed = appointments.reduce(
      (sum, a) => sum + (a.services?.length ?? 0),
      0,
    );

    const activeProfessionals = professionals.filter((p) => p.ativo).length;

    return {
      appointmentsToday: appointments.length,
      activeClientsToday: uniqueClients.size,
      activeProfessionals,
      servicesPerformedToday: servicesPerformed,
      upcoming: this.toUpcoming(appointments),
    };
  }

  private toUpcoming(appointments: AdminAppointment[]): UpcomingAppointmentItem[] {
    const now = new Date();

    return appointments
      .filter((apt) => {
        const iso = DateUtils.formatToISO(new Date());
        const aptTime = DateUtils.toDateTime(iso, apt.startTime);
        return aptTime >= now;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .slice(0, 8)
      .map((apt) => ({
        id: apt.id,
        clientName: apt.clientName || 'Cliente',
        serviceName: apt.services?.[0] ?? apt.services?.join(', ') ?? 'Serviço',
        startTime: apt.startTime?.slice(0, 5) ?? '--:--',
        initials: this.getInitials(apt.clientName || 'C'),
      }));
  }

  private getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
}
