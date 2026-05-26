import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { AppointmentsApiService } from '../../../core/services';
import { AdminAppointment } from '../../../core/models';
import { DateUtils } from '../../../core/utils';
import { AdminSidebarService } from '../admin-sidebar.service';
import { ClienteService } from '../admin-clientes/cliente.service';
import { ProfissionaisService, Professional } from '../admin-profissionais/profissionais.service';
import { ServicosService, Servico } from '../admin-servicos/servicos.service';
import { ScheduleBlock } from '../schedule-blocks/models/schedule-block.model';
import { AppointmentAdminService } from './appointment-admin.service';
import {
  AppointmentCalendarEvent,
  AppointmentFilters,
  AppointmentViewMode,
} from './models/appointment-view.model';
import { formatAppointmentStatus, matchesSearch, matchesStatusFilter } from './appointment.utils';
import { AppointmentHeader } from './components/appointment-header/appointment-header';
import { AppointmentFiltersPanel } from './components/appointment-filters/appointment-filters';
import { AppointmentCalendar } from './components/appointment-calendar/appointment-calendar';
import { AppointmentCard } from './components/appointment-card/appointment-card';
import { AppointmentDetails } from './components/appointment-details/appointment-details';
import {
  AppointmentForm,
  AppointmentFormSave,
} from './components/appointment-form/appointment-form';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-admin-appointments',
  imports: [
    AppointmentHeader,
    AppointmentFiltersPanel,
    AppointmentCalendar,
    AppointmentCard,
    AppointmentDetails,
    AppointmentForm,
  ],
  templateUrl: './admin-appointments.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAppointments implements OnInit {
  private readonly appointmentAdmin = inject(AppointmentAdminService);
  private readonly appointmentsApi = inject(AppointmentsApiService);
  private readonly clienteService = inject(ClienteService);
  private readonly profissionaisService = inject(ProfissionaisService);
  private readonly servicosService = inject(ServicosService);
  private readonly sidebar = inject(AdminSidebarService);

  selectedDate = signal(DateUtils.formatToISO(new Date()));
  viewMode = signal<AppointmentViewMode>('day');
  filters = signal<AppointmentFilters>({
    professionalId: null,
    status: 'all',
    period: 'today',
    search: '',
  });

  events = signal<AppointmentCalendarEvent[]>([]);
  blocks = signal<ScheduleBlock[]>([]);
  professionals = signal<Professional[]>([]);
  clients = signal<import('../admin-clientes/models/cliente.model').Cliente[]>([]);
  services = signal<Servico[]>([]);
  availableDates = signal<string[]>([]);

  openTime = signal('08:00');
  closeTime = signal('18:00');
  slotInterval = signal(30);

  isLoading = signal(true);
  isLoadingDetails = signal(false);
  loadError = signal('');
  showFiltersMobile = signal(false);
  showFormModal = signal(false);
  editingAppointment = signal<AdminAppointment | null>(null);
  selectedEvent = signal<AppointmentCalendarEvent | null>(null);
  isSaving = signal(false);

  showToast = signal(false);
  toastMessage = signal('');
  toastType = signal<ToastType>('success');

  filteredEvents = computed(() => {
    const f = this.filters();
    let list = this.events().filter((e) => {
      if (f.professionalId !== null && e.professionalId !== f.professionalId) return false;
      if (!matchesStatusFilter(e.status, f.status)) return false;
      if (!matchesSearch(e, f.search)) return false;
      return true;
    });
    if (this.viewMode() === 'day') {
      list = list.filter((e) => e.date === this.selectedDate());
    }
    return list;
  });

  professionalColumns = computed(() => {
    const f = this.filters();
    if (f.professionalId !== null) {
      const p = this.professionals().find((x) => x.id === f.professionalId);
      return [{ id: f.professionalId, label: p?.nome ?? 'Profissional' }];
    }
    const active = this.professionals().filter((p) => p.ativo);
    if (active.length === 0) return [{ id: null, label: 'Agenda' }];
    return active.map((p) => ({ id: p.id, label: p.nome }));
  });

  mobileSortedEvents = computed(() =>
    [...this.filteredEvents()].sort((a, b) => {
      const d = a.date.localeCompare(b.date);
      if (d !== 0) return d;
      return a.startTime.localeCompare(b.startTime);
    }),
  );

  ngOnInit(): void {
    this.applyPeriodToDate();
    this.loadReferenceData();
    this.refresh();
  }

  openMenu(): void {
    this.sidebar.open();
  }

  openFiltersDrawer(): void {
    this.showFiltersMobile.set(true);
  }

  closeFiltersDrawer(): void {
    this.showFiltersMobile.set(false);
  }

  onDateChange(iso: string): void {
    this.selectedDate.set(iso);
    this.filters.update((f) => ({ ...f, period: 'today' }));
    this.refresh();
  }

  onViewModeChange(mode: AppointmentViewMode): void {
    this.viewMode.set(mode);
    this.refresh();
  }

  goToday(): void {
    this.selectedDate.set(DateUtils.formatToISO(new Date()));
    this.filters.update((f) => ({ ...f, period: 'today' }));
    this.refresh();
  }

  onFiltersChange(filters: AppointmentFilters): void {
    const periodChanged = filters.period !== this.filters().period;
    this.filters.set(filters);
    if (periodChanged) {
      this.applyPeriodToDate();
    }
    this.refresh();
  }

  clearFilters(): void {
    this.filters.set({
      professionalId: null,
      status: 'all',
      period: 'today',
      search: '',
    });
    this.applyPeriodToDate();
    this.refresh();
  }

  refresh(): void {
    this.isLoading.set(true);
    this.loadError.set('');

    const iso = this.selectedDate();
    const f = this.filters();
    const apiFilters = { professionalId: f.professionalId, status: f.status };

    const load$ =
      this.viewMode() === 'week'
        ? this.appointmentAdmin.getAppointmentsForRange(
            iso,
            DateUtils.formatToISO(DateUtils.addDays(DateUtils.parseISODate(iso), 6)),
            apiFilters,
          )
        : this.appointmentAdmin.getAppointmentsForDate(iso, apiFilters);

    load$.subscribe({
      next: (data) => {
        this.events.set(data);
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        this.loadError.set(err.message);
        this.isLoading.set(false);
      },
    });

    this.appointmentAdmin.getScheduleBlocksForDate(iso).subscribe({
      next: (b) => this.blocks.set(b),
      error: () => this.blocks.set([]),
    });

    this.appointmentAdmin.getBusinessHoursForDate(iso).subscribe({
      next: (h) => {
        this.openTime.set(h.open);
        this.closeTime.set(h.close);
        this.slotInterval.set(h.interval);
      },
    });
  }

  openNewModal(): void {
    this.editingAppointment.set(null);
    this.showFormModal.set(true);
    this.appointmentsApi.getAvailableDates().subscribe({
      next: (dates) => this.availableDates.set(dates),
      error: () => this.availableDates.set([]),
    });
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
    this.editingAppointment.set(null);
  }

  onFormSave(result: AppointmentFormSave): void {
    this.isSaving.set(true);

    if (result.mode === 'create') {
      this.appointmentsApi.createAppointment(result.payload).subscribe({
        next: () => this.onSaveSuccess('Agendamento criado com sucesso.'),
        error: (err: Error) => this.onSaveError(err.message),
      });
      return;
    }

    this.appointmentsApi.updateAppointment(result.id, result.payload).subscribe({
      next: () => this.onSaveSuccess('Agendamento atualizado com sucesso.'),
      error: (err: Error) => this.onSaveError(err.message),
    });
  }

  selectEvent(event: AppointmentCalendarEvent): void {
    this.selectedEvent.set(event);
    this.isLoadingDetails.set(true);

    this.appointmentAdmin.getAppointmentById(event.id).subscribe({
      next: (full) => {
        this.selectedEvent.set(full);
        this.isLoadingDetails.set(false);
      },
      error: () => this.isLoadingDetails.set(false),
    });
  }

  closeDetails(): void {
    this.selectedEvent.set(null);
  }

  onEditFromDetails(event: AppointmentCalendarEvent): void {
    this.closeDetails();
    this.editingAppointment.set(event);
    this.showFormModal.set(true);
    this.appointmentsApi.getAvailableDates().subscribe({
      next: (dates) => {
        const merged = dates.includes(event.date) ? dates : [event.date, ...dates];
        this.availableDates.set(merged);
      },
      error: () => this.availableDates.set([event.date]),
    });
  }

  onCancelFromDetails(event: AppointmentCalendarEvent): void {
    this.isSaving.set(true);
    this.appointmentsApi.cancelAppointment(event.id).subscribe({
      next: (updated) => {
        this.isSaving.set(false);
        this.selectedEvent.set(this.toCalendarEvent(updated));
        this.showToastMessage('Agendamento cancelado.', 'success');
        this.refresh();
      },
      error: (err: Error) => {
        this.isSaving.set(false);
        this.showToastMessage(err.message, 'error');
      },
    });
  }

  onCompleteFromDetails(event: AppointmentCalendarEvent): void {
    this.isSaving.set(true);
    this.appointmentsApi.finishAppointment(event.id).subscribe({
      next: (updated) => {
        this.isSaving.set(false);
        this.selectedEvent.set(this.toCalendarEvent(updated));
        this.showToastMessage('Agendamento finalizado.', 'success');
        this.refresh();
      },
      error: (err: Error) => {
        this.isSaving.set(false);
        this.showToastMessage(err.message, 'error');
      },
    });
  }

  dismissToast(): void {
    this.showToast.set(false);
  }

  private onSaveSuccess(message: string): void {
    this.isSaving.set(false);
    this.closeFormModal();
    this.showToastMessage(message, 'success');
    this.refresh();
  }

  private onSaveError(message: string): void {
    this.isSaving.set(false);
    this.showToastMessage(message, 'error');
  }

  private toCalendarEvent(item: AdminAppointment): AppointmentCalendarEvent {
    return {
      ...item,
      serviceLabel: item.services.join(', ') || '—',
      statusLabel: formatAppointmentStatus(item.status),
      professionalName: item.professionalName ?? `Prof. #${item.professionalId}`,
    };
  }

  private applyPeriodToDate(): void {
    const today = new Date();
    const period = this.filters().period;
    if (period === 'today') {
      this.selectedDate.set(DateUtils.formatToISO(today));
    } else if (period === 'tomorrow') {
      this.selectedDate.set(DateUtils.formatToISO(DateUtils.addDays(today, 1)));
    } else if (period === 'week') {
      this.selectedDate.set(DateUtils.formatToISO(today));
      this.viewMode.set('week');
    } else if (period === 'month') {
      this.selectedDate.set(DateUtils.formatToISO(today));
    }
  }

  private loadReferenceData(): void {
    this.profissionaisService.getProfessionals().subscribe({
      next: (p) => this.professionals.set(p),
      error: () => this.professionals.set([]),
    });
    this.clienteService.listAll().subscribe({
      next: (c) => this.clients.set(c),
      error: () => this.clients.set([]),
    });
    this.servicosService.getServicos().subscribe({
      next: (s) => this.services.set(s),
      error: () => this.services.set([]),
    });
  }

  private showToastMessage(message: string, type: ToastType): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 4000);
  }
}
