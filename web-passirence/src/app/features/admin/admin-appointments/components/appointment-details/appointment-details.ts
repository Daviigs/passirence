import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AppointmentCalendarEvent } from '../../models/appointment-view.model';
import { formatPhoneDisplay, isAppointmentEditable } from '../../appointment.utils';
import { AppointmentDetailContent } from '../appointment-detail-content/appointment-detail-content';

export type AppointmentDetailsLayout = 'drawer' | 'embedded';

@Component({
  selector: 'app-appointment-details',
  imports: [AppointmentDetailContent],
  templateUrl: './appointment-details.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentDetails {
  event = input<AppointmentCalendarEvent | null>(null);
  layout = input<AppointmentDetailsLayout>('drawer');
  loading = input(false);

  close = output<void>();
  edit = output<AppointmentCalendarEvent>();
  cancel = output<AppointmentCalendarEvent>();
  complete = output<AppointmentCalendarEvent>();

  phone = () => (this.event() ? formatPhoneDisplay(this.event()!.clientPhone) : '');
  editable = () => (this.event() ? isAppointmentEditable(this.event()!.status) : false);
}
