import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AppointmentCalendarEvent } from '../../models/appointment-view.model';
import { AppointmentCard } from '../appointment-card/appointment-card';
import { AppointmentDetails } from '../appointment-details/appointment-details';

export interface DayPanelSummary {
  total: number;
  active: number;
  scheduled: number;
  completed: number;
}

@Component({
  selector: 'app-appointment-day-panel',
  imports: [AppointmentCard, AppointmentDetails],
  templateUrl: './appointment-day-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentDayPanel {
  events = input<AppointmentCalendarEvent[]>([]);
  selected = input<AppointmentCalendarEvent | null>(null);
  summary = input<DayPanelSummary>({ total: 0, active: 0, scheduled: 0, completed: 0 });
  dateLabel = input('');
  businessHours = input('');
  isLoading = input(false);
  isLoadingDetails = input(false);

  select = output<AppointmentCalendarEvent>();
  newAppointment = output<void>();
  closeDetails = output<void>();
  edit = output<AppointmentCalendarEvent>();
  cancel = output<AppointmentCalendarEvent>();
  complete = output<AppointmentCalendarEvent>();
}
