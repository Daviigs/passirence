import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ScheduleBlock } from '../../../schedule-blocks/models/schedule-block.model';
import { AppointmentCalendarEvent } from '../../models/appointment-view.model';
import {
  buildTimeSlots,
  getEventHeightPercent,
  getEventTopPercent,
  timeToMinutes,
} from '../../appointment.utils';
import { AppointmentCard } from '../appointment-card/appointment-card';

@Component({
  selector: 'app-appointment-calendar',
  imports: [AppointmentCard],
  templateUrl: './appointment-calendar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentCalendar {
  events = input<AppointmentCalendarEvent[]>([]);
  blocks = input<ScheduleBlock[]>([]);
  openTime = input('08:00');
  closeTime = input('18:00');
  slotInterval = input(30);
  isLoading = input(false);
  showCurrentTime = input(false);
  professionalColumns = input<{ id: number | null; label: string }[]>([{ id: null, label: 'Agenda' }]);

  selectEvent = output<AppointmentCalendarEvent>();

  slots = () => buildTimeSlots(this.openTime(), this.closeTime(), this.slotInterval());
  dayStart = () => timeToMinutes(this.openTime());
  dayEnd = () => timeToMinutes(this.closeTime());
  gridHeight = () => Math.max(this.slots().length * 48, 400);

  currentTimeTop = (): string | null => {
    if (!this.showCurrentTime()) return null;
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const start = this.dayStart();
    const end = this.dayEnd();
    if (minutes < start || minutes > end) return null;
    const pct = ((minutes - start) / (end - start)) * 100;
    return `${pct}%`;
  };

  eventsForColumn(professionalId: number | null): AppointmentCalendarEvent[] {
    return this.events().filter((e) =>
      professionalId === null ? true : e.professionalId === professionalId,
    );
  }

  blocksForColumn(professionalId: number | null): ScheduleBlock[] {
    return this.blocks().filter(
      (b) => b.professionalId == null || b.professionalId === professionalId,
    );
  }

  top(event: AppointmentCalendarEvent): string {
    return `${getEventTopPercent(event.startTime, this.dayStart(), this.dayEnd())}%`;
  }

  height(event: AppointmentCalendarEvent): string {
    return `${getEventHeightPercent(event.startTime, event.endTime, this.dayStart(), this.dayEnd())}%`;
  }

  blockTop(block: ScheduleBlock): string {
    return `${getEventTopPercent(block.startTime, this.dayStart(), this.dayEnd())}%`;
  }

  blockHeight(block: ScheduleBlock): string {
    return `${getEventHeightPercent(block.startTime, block.endTime, this.dayStart(), this.dayEnd())}%`;
  }
}
