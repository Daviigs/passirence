import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppointmentViewMode } from '../../models/appointment-view.model';

@Component({
  selector: 'app-appointment-header',
  imports: [FormsModule],
  templateUrl: './appointment-header.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentHeader {
  selectedDate = input('');
  viewMode = input<AppointmentViewMode>('day');
  isLoading = input(false);
  dateLabel = input('');
  summaryLine = input('');

  dateChange = output<string>();
  viewModeChange = output<AppointmentViewMode>();
  goToday = output<void>();
  prevDay = output<void>();
  nextDay = output<void>();
  refresh = output<void>();
  newAppointment = output<void>();
  openFilters = output<void>();
}
