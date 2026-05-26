import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  AppointmentsApiService,
  AppointmentStateService,
  ProfessionalsApiService,
} from '../../core/services';
import { DateUtils, TimeUtils } from '../../core/utils';

interface DateOption {
  date: Date;
  dayName: string;
  dayNumber: string;
  monthYear: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

@Component({
  selector: 'app-schedules',
  imports: [],
  templateUrl: './schedules.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulesComponent implements OnInit {
  dates = signal<DateOption[]>([]);
  selectedDate = signal<DateOption | null>(null);
  timeSlots = signal<TimeSlot[]>([]);
  selectedTime = signal<TimeSlot | null>(null);
  isLoadingDates = signal(true);
  isLoadingSlots = signal(false);
  datesError = signal('');
  slotsError = signal('');

  constructor(
    private readonly appointmentsApi: AppointmentsApiService,
    private readonly router: Router,
    private readonly appointmentState: AppointmentStateService,
    private readonly professionalsService: ProfessionalsApiService,
  ) {}

  ngOnInit(): void {
    if (!this.validateProfessionalSelection()) {
      return;
    }
    this.loadAvailableDates();
  }

  private validateProfessionalSelection(): boolean {
    const appointmentData = this.appointmentState.getAppointmentData();
    if (!appointmentData?.professionalId || appointmentData.professionalId <= 0) {
      this.router.navigate(['/professionals']);
      return false;
    }
    if (!appointmentData.serviceIds?.length) {
      this.router.navigate(['/services']);
      return false;
    }
    return true;
  }

  private loadAvailableDates(): void {
    this.isLoadingDates.set(true);
    this.datesError.set('');

    this.appointmentsApi.getAvailableDates().subscribe({
      next: (availableDates) => {
        this.dates.set(this.toDateOptions(availableDates));
        this.isLoadingDates.set(false);

        if (this.dates().length === 1) {
          this.selectDate(this.dates()[0]);
        }
      },
      error: (err: Error) => {
        this.datesError.set(err.message || 'Não foi possível carregar as datas disponíveis.');
        this.dates.set([]);
        this.isLoadingDates.set(false);
      },
    });
  }

  private toDateOptions(isoDates: string[]): DateOption[] {
    return isoDates.map((dateStr) => {
      const date = DateUtils.parseISODate(dateStr);
      return {
        date,
        dayName: DateUtils.getDayNameShort(date),
        dayNumber: date.getDate().toString().padStart(2, '0'),
        monthYear: `${DateUtils.getMonthNameShort(date)} ${date.getFullYear()}`,
      };
    });
  }

  selectDate(date: DateOption): void {
    this.selectedDate.set(date);
    this.selectedTime.set(null);
    this.slotsError.set('');
    this.loadAvailableSlots(date.date);
  }

  private loadAvailableSlots(date: Date): void {
    this.isLoadingSlots.set(true);
    this.timeSlots.set([]);
    this.slotsError.set('');

    const appointmentData = this.appointmentState.getAppointmentData();
    if (!appointmentData?.professionalId || appointmentData.professionalId <= 0) {
      this.router.navigate(['/professionals']);
      return;
    }

    const formattedDate = DateUtils.formatToISO(date);
    const serviceIds = appointmentData.serviceIds ?? [];

    this.appointmentsApi
      .getAvailableTimes(formattedDate, appointmentData.professionalId, serviceIds)
      .subscribe({
        next: (slots) => {
          this.timeSlots.set(
            slots.map((slot) => ({
              time: TimeUtils.formatToShort(slot),
              available: true,
            })),
          );
          this.isLoadingSlots.set(false);
        },
        error: (err: Error) => {
          this.slotsError.set(err.message || 'Não foi possível carregar os horários disponíveis.');
          this.timeSlots.set([]);
          this.isLoadingSlots.set(false);
        },
      });
  }

  selectTime(slot: TimeSlot): void {
    if (slot.available) {
      this.selectedTime.set(slot);
    }
  }

  isDateSelected(date: DateOption): boolean {
    return this.selectedDate()?.date.getTime() === date.date.getTime();
  }

  isTimeSelected(slot: TimeSlot): boolean {
    return this.selectedTime()?.time === slot.time;
  }

  continue(): void {
    const date = this.selectedDate();
    const time = this.selectedTime();
    if (!date || !time) return;

    const currentData = this.appointmentState.getAppointmentData();
    if (currentData) {
      this.appointmentState.setAppointmentData({
        ...currentData,
        date: DateUtils.formatToISO(date.date),
        time: time.time,
      });
    }

    this.router.navigate(['/user']);
  }

  goBack(): void {
    this.professionalsService.getActive().subscribe({
      next: (professionals) => {
        this.router.navigate(
          professionals.length <= 1 ? ['/services'] : ['/professionals'],
        );
      },
      error: () => this.router.navigate(['/professionals']),
    });
  }
}
