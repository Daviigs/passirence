import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { AppointmentsApiService } from '../../../core/services';
import { AdminAppointment } from '../../../core/models';
import { DateUtils } from '../../../core/utils';

export interface DateOption {
  date: Date;
  dayName: string;
  dayNumber: string;
  monthYear: string;
}

@Component({
  selector: 'app-admin-agendamentos',
  imports: [],
  templateUrl: './admin-agendamentos.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAgendamentos implements OnInit {
  private readonly appointmentsApi = inject(AppointmentsApiService);

  dates = signal<DateOption[]>([]);
  selectedDate = signal<DateOption | null>(null);
  appointments = signal<AdminAppointment[]>([]);
  isLoading = signal(false);
  loadError = signal('');

  appointmentCount = computed(() => this.appointments().length);

  ngOnInit(): void {
    this.appointmentsApi.getAvailableDates().subscribe({
      next: (isoDates) => {
        const options = isoDates.slice(0, 14).map((dateStr) => this.toDateOption(dateStr));
        this.dates.set(options);
        if (options.length > 0) {
          this.selectDate(options[0]);
        }
      },
      error: () => {
        this.dates.set(this.generateFallbackDates());
        const first = this.dates()[0];
        if (first) this.selectDate(first);
      },
    });
  }

  private toDateOption(dateStr: string): DateOption {
    const date = DateUtils.parseISODate(dateStr);
    return {
      date,
      dayName: DateUtils.getDayNameShort(date),
      dayNumber: String(date.getDate()).padStart(2, '0'),
      monthYear: `${DateUtils.getMonthNameShort(date)} ${date.getFullYear()}`,
    };
  }

  private generateFallbackDates(): DateOption[] {
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = DateUtils.addDays(today, i);
      return {
        date: d,
        dayName: DateUtils.getDayNameShort(d),
        dayNumber: String(d.getDate()).padStart(2, '0'),
        monthYear: `${DateUtils.getMonthNameShort(d)} ${d.getFullYear()}`,
      };
    });
  }

  isDateSelected(date: DateOption): boolean {
    return this.selectedDate()?.date.toDateString() === date.date.toDateString();
  }

  selectDate(date: DateOption): void {
    this.selectedDate.set(date);
    this.loadAppointments(date);
  }

  private loadAppointments(date: DateOption): void {
    this.isLoading.set(true);
    this.loadError.set('');
    this.appointments.set([]);

    const iso = DateUtils.formatToISO(date.date);
    this.appointmentsApi.getByDate(iso).subscribe({
      next: (data) => {
        this.appointments.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('Erro ao carregar agendamentos.');
        this.isLoading.set(false);
      },
    });
  }

  formatTime(startTime: string): string {
    return startTime ?? '--:--';
  }

  formatPhone(phone: string): string {
    const d = phone.replace(/\D/g, '');
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return phone;
  }

  getServiceNames(appointment: AdminAppointment): string {
    return appointment.services?.join(', ') ?? '';
  }
}
