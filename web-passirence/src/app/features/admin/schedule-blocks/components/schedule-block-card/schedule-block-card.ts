import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ScheduleBlock } from '../../models/schedule-block.model';
import { ScheduleBlockBadge } from '../schedule-block-badge/schedule-block-badge';
import {
  formatBlockDate,
  formatTimeRange,
  getTypeLabel,
} from '../../schedule-block.utils';

@Component({
  selector: 'app-schedule-block-card',
  imports: [ScheduleBlockBadge],
  templateUrl: './schedule-block-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleBlockCard {
  block = input.required<ScheduleBlock>();
  professionalName = input('—');
  edit = output<ScheduleBlock>();
  remove = output<ScheduleBlock>();

  typeLabel = () => getTypeLabel(this.block().type);
  dateLabel = () => formatBlockDate(this.block());
  timeLabel = () => formatTimeRange(this.block().startTime, this.block().endTime);
}
