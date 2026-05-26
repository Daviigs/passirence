import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ScheduleBlockBadgeVariant = 'recurring' | 'oneoff' | 'global' | 'professional';

@Component({
  selector: 'app-schedule-block-badge',
  templateUrl: './schedule-block-badge.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleBlockBadge {
  label = input.required<string>();
  variant = input<ScheduleBlockBadgeVariant>('oneoff');
}
