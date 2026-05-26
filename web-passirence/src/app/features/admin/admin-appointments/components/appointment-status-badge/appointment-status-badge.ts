import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { statusBadgeClass } from '../../appointment.utils';

@Component({
  selector: 'app-appointment-status-badge',
  template: `
    <span
      class="inline-flex px-2.5 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-wider border"
      [class]="badgeClass()"
    >
      {{ label() }}
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentStatusBadge {
  status = input('');
  label = input('');

  badgeClass = () => statusBadgeClass(this.status());
}
