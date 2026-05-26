import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AppointmentCalendarEvent } from '../../models/appointment-view.model';
import { AppointmentStatusBadge } from '../appointment-status-badge/appointment-status-badge';
import { formatPhoneDisplay, isAppointmentEditable } from '../../appointment.utils';

@Component({
  selector: 'app-appointment-details',
  imports: [AppointmentStatusBadge],
  templateUrl: './appointment-details.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentDetails {
  event = input<AppointmentCalendarEvent | null>(null);
  close = output<void>();
  edit = output<AppointmentCalendarEvent>();
  cancel = output<AppointmentCalendarEvent>();
  complete = output<AppointmentCalendarEvent>();

  phone = () => (this.event() ? formatPhoneDisplay(this.event()!.clientPhone) : '');
  editable = () => (this.event() ? isAppointmentEditable(this.event()!.status) : false);
}
