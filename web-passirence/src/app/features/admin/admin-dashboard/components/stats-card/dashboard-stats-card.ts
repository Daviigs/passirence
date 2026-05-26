import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-dashboard-stats-card',
  templateUrl: './dashboard-stats-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardStatsCard {
  label = input.required<string>();
  value = input.required<string | number>();
  subtitle = input('');
  icon = input<'calendar' | 'users' | 'scissors' | 'chart'>('calendar');
  accent = input<'blue' | 'gold'>('blue');
}
