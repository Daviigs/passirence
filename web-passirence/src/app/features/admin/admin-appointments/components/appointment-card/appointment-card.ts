import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AppointmentCalendarEvent } from '../../models/appointment-view.model';
import { AppointmentStatusBadge } from '../appointment-status-badge/appointment-status-badge';
import { cardAccentClass } from '../../appointment.utils';

@Component({
  selector: 'app-appointment-card',
  imports: [AppointmentStatusBadge],
  templateUrl: './appointment-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentCard {
  event = input.required<AppointmentCalendarEvent>();
  compact = input(false);
  select = output<AppointmentCalendarEvent>();

  accent = () => cardAccentClass(this.event().status);
}
