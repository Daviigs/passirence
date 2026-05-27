import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AppointmentsApiService, ServicesApiService } from '../../core/services';
import { ClientAppointment } from '../../core/models';
import {
  formatAppointmentStatusLabel,
  normalizeAppointmentStatus,
} from '../../core/models/appointment-status';
import { DateUtils, TimeUtils } from '../../core/utils';

interface AppointmentView {
  id: number;
  serviceLabel: string;
  date: string;
  startTime: string;
  endTime: string;
  professionalId: number;
  status: string;
  isUpcoming: boolean;
}

@Component({
  selector: 'app-appointments',
  imports: [RouterLink],
  templateUrl: './appointments.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly appointmentsApi = inject(AppointmentsApiService);
  private readonly servicesApi = inject(ServicesApiService);

  clientId = signal(0);
  clientName = signal('');
  upcomingAppointments = signal<AppointmentView[]>([]);
  completedAppointments = signal<AppointmentView[]>([]);
  isLoading = signal(true);
  loadError = signal('');

  ngOnInit(): void {
    const state = history.state as { clientId?: number; clientName?: string };
    const queryId = Number(this.route.snapshot.queryParamMap.get('clientId'));

    const id = state?.clientId ?? queryId;
    if (!id || id <= 0) {
      this.router.navigate(['/']);
      return;
    }

    this.clientId.set(id);
    if (state?.clientName) {
      this.clientName.set(state.clientName);
    }

    this.loadAppointments();
  }

  private loadAppointments(): void {
    this.isLoading.set(true);
    this.loadError.set('');

    forkJoin({
      appointments: this.appointmentsApi.getByClientId(this.clientId()),
      services: this.servicesApi.getServices(),
    }).subscribe({
      next: ({ appointments, services }) => {
        const serviceMap = new Map(services.map((s) => [s.id, s.name]));
        const views = appointments
          .map((apt) => this.toView(apt, serviceMap))
          .sort((a, b) => this.sortKey(b) - this.sortKey(a));

        this.upcomingAppointments.set(views.filter((v) => v.isUpcoming));
        this.completedAppointments.set(views.filter((v) => !v.isUpcoming));
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        this.loadError.set(err.message || 'Erro ao carregar agendamentos.');
        this.isLoading.set(false);
      },
    });
  }

  private toView(
    apt: ClientAppointment,
    serviceMap: Map<number, string>,
  ): AppointmentView {
    const now = new Date();
    const aptDateTime = DateUtils.toDateTime(apt.date, apt.startTime);
    const normalized = normalizeAppointmentStatus(apt.status);
    const isUpcoming = normalized === 'scheduled' && aptDateTime >= now;

    const serviceLabel =
      apt.serviceIds.map((id) => serviceMap.get(id) ?? `Serviço #${id}`).join(', ') ||
      'Serviços não informados';

    return {
      id: apt.id,
      serviceLabel,
      date: apt.date,
      startTime: apt.startTime,
      endTime: apt.endTime,
      professionalId: apt.professionalId,
      status: normalized,
      isUpcoming,
    };
  }

  private sortKey(view: AppointmentView): number {
    return DateUtils.toDateTime(view.date, view.startTime).getTime();
  }

  formatDate(dateString: string): string {
    return DateUtils.formatToLongBrazilian(dateString);
  }

  formatTime(time: string): string {
    return TimeUtils.formatToShort(time);
  }

  formatStatus(status: string): string {
    return formatAppointmentStatusLabel(status);
  }
}
