import { inject, Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AppointmentsApiService } from '../../../core/services';
import { AppointmentListFilters } from '../../../core/models';
import { AdminAppointment } from '../../../core/models';
import { ScheduleBlockService } from '../schedule-blocks/schedule-block.service';
import { SettingsService } from '../admin-configuracoes/settings.service';
import { ScheduleBlock } from '../schedule-blocks/models/schedule-block.model';
import { DateUtils } from '../../../core/utils';
import { AppointmentCalendarEvent, AppointmentStatusFilter } from './models/appointment-view.model';
import { formatAppointmentStatus } from './appointment.utils';

@Injectable({ providedIn: 'root' })
export class AppointmentAdminService {
  private readonly appointmentsApi = inject(AppointmentsApiService);
  private readonly scheduleBlockService = inject(ScheduleBlockService);
  private readonly settingsService = inject(SettingsService);

  getAppointmentsForDate(
    isoDate: string,
    filters: { professionalId?: number | null; status?: AppointmentStatusFilter } = {},
  ): Observable<AppointmentCalendarEvent[]> {
    return this.appointmentsApi
      .list(this.buildListFilters(isoDate, filters))
      .pipe(map((items) => items.map((item) => this.toCalendarEvent(item))));
  }

  getAppointmentsForRange(
    startIso: string,
    endIso: string,
    filters: { professionalId?: number | null; status?: AppointmentStatusFilter } = {},
  ): Observable<AppointmentCalendarEvent[]> {
    const dates = this.enumerateDates(startIso, endIso);
    return forkJoin(
      dates.map((d) => this.getAppointmentsForDate(d, filters)),
    ).pipe(map((lists) => lists.flat()));
  }

  getAppointmentById(id: number): Observable<AppointmentCalendarEvent> {
    return this.appointmentsApi
      .getById(id)
      .pipe(map((item) => this.toCalendarEvent(item)));
  }

  getScheduleBlocksForDate(isoDate: string): Observable<ScheduleBlock[]> {
    return this.scheduleBlockService.list({ date: isoDate }).pipe(
      map((blocks) => blocks.filter((b) => this.blockMatchesDate(b, isoDate))),
      catchError(() => of([])),
    );
  }

  getBusinessHoursForDate(isoDate: string): Observable<{ open: string; close: string; interval: number }> {
    return this.settingsService.getSettings().pipe(
      map((settings) => {
        const weekday = DateUtils.parseISODate(isoDate).getDay();
        const day = settings.businessHours.find((h) => h.weekday === weekday);
        if (day?.isOpen && day.openTime && day.closeTime) {
          return { open: day.openTime, close: day.closeTime, interval: settings.slotInterval || 30 };
        }
        return { open: '08:00', close: '18:00', interval: settings.slotInterval || 30 };
      }),
      catchError(() => of({ open: '08:00', close: '18:00', interval: 30 })),
    );
  }

  private buildListFilters(
    isoDate: string,
    filters: { professionalId?: number | null; status?: AppointmentStatusFilter },
  ): AppointmentListFilters {
    const apiFilters: AppointmentListFilters = { date: isoDate };

    if (filters.professionalId != null) {
      apiFilters.professionalId = filters.professionalId;
    }

    if (filters.status && filters.status !== 'all') {
      apiFilters.status = filters.status;
    }

    return apiFilters;
  }

  private toCalendarEvent(item: AdminAppointment): AppointmentCalendarEvent {
    const serviceLabel = item.services.length > 0 ? item.services.join(', ') : '—';
    return {
      ...item,
      serviceLabel,
      statusLabel: formatAppointmentStatus(item.status),
      professionalName: item.professionalName ?? `Prof. #${item.professionalId}`,
    };
  }

  private blockMatchesDate(block: ScheduleBlock, isoDate: string): boolean {
    const date = DateUtils.parseISODate(isoDate);
    if (block.isRecurring && block.weekDay !== null && block.weekDay !== undefined) {
      return date.getDay() === block.weekDay;
    }
    return block.date === isoDate;
  }

  private enumerateDates(startIso: string, endIso: string): string[] {
    const dates: string[] = [];
    let current = DateUtils.parseISODate(startIso);
    const end = DateUtils.parseISODate(endIso);
    while (current <= end) {
      dates.push(DateUtils.formatToISO(current));
      current = DateUtils.addDays(current, 1);
    }
    return dates;
  }
}
