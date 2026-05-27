import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AppointmentCalendarEvent } from '../../models/appointment-view.model';
import { AppointmentStatusBadge } from '../appointment-status-badge/appointment-status-badge';

@Component({
  selector: 'app-appointment-detail-content',
  imports: [AppointmentStatusBadge],
  templateUrl: './appointment-detail-content.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentDetailContent {
  appointment = input.required<AppointmentCalendarEvent>();
  phoneDisplay = input('');
  editable = input(false);
  compact = input(false);

  close = output<void>();
  edit = output<void>();
  cancel = output<void>();
  complete = output<void>();
}
