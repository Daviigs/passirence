import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ScheduleBlock } from '../../models/schedule-block.model';
import { ScheduleBlockBadge } from '../schedule-block-badge/schedule-block-badge';
import {
  formatBlockDate,
  formatTimeRange,
  getTypeLabel,
} from '../../schedule-block.utils';

export interface ScheduleBlockRow extends ScheduleBlock {
  professionalLabel: string;
}

@Component({
  selector: 'app-schedule-block-table',
  imports: [ScheduleBlockBadge],
  templateUrl: './schedule-block-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleBlockTable {
  rows = input<ScheduleBlockRow[]>([]);
  isLoading = input(false);
  edit = output<ScheduleBlock>();
  remove = output<ScheduleBlock>();

  typeLabel = (block: ScheduleBlock) => getTypeLabel(block.type);
  dateLabel = (block: ScheduleBlock) => formatBlockDate(block);
  timeLabel = (block: ScheduleBlock) => formatTimeRange(block.startTime, block.endTime);
}
