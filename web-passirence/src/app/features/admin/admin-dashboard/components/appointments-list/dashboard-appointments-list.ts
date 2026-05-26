import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface UpcomingAppointmentItem {
  id: number;
  clientName: string;
  serviceName: string;
  startTime: string;
  initials: string;
}

@Component({
  selector: 'app-dashboard-appointments-list',
  templateUrl: './dashboard-appointments-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardAppointmentsList {
  appointments = input<UpcomingAppointmentItem[]>([]);
  isLoading = input(false);
  newAppointment = output<void>();
}
