import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-available-times',
  templateUrl: './available-times.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvailableTimes {
  times = input<string[]>([]);
  selectedTime = input('');
  isLoading = input(false);
  timeSelect = output<string>();
}
