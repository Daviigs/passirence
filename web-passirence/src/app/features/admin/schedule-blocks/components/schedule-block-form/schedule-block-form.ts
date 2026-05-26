import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Professional } from '../../../admin-profissionais/profissionais.service';
import {
  CreateScheduleBlockDTO,
  ScheduleBlock,
  ScheduleBlockType,
  SCHEDULE_BLOCK_TYPE_OPTIONS,
  WEEKDAY_OPTIONS,
} from '../../models/schedule-block.model';
import { isEndBeforeStart, isFullDay } from '../../schedule-block.utils';

@Component({
  selector: 'app-schedule-block-form',
  imports: [FormsModule],
  templateUrl: './schedule-block-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleBlockForm {
  professionals = input<Professional[]>([]);
  block = input<ScheduleBlock | null>(null);
  isSaving = input(false);

  save = output<CreateScheduleBlockDTO>();
  cancel = output<void>();

  readonly typeOptions = SCHEDULE_BLOCK_TYPE_OPTIONS;
  readonly weekdayOptions = WEEKDAY_OPTIONS;

  type = signal<ScheduleBlockType>('LUNCH');
  isGlobal = signal(false);
  professionalId = signal<number | null>(null);
  isRecurring = signal(true);
  weekDay = signal(1);
  date = signal('');
  startTime = signal('12:00');
  endTime = signal('13:00');
  reason = signal('');

  formError = signal('');

  constructor() {
    effect(() => {
      const editing = this.block();
      if (editing) {
        this.type.set(editing.type);
        this.isGlobal.set(editing.professionalId == null);
        this.professionalId.set(editing.professionalId ?? null);
        this.isRecurring.set(editing.isRecurring);
        this.weekDay.set(editing.weekDay ?? 1);
        this.date.set(editing.date ?? '');
        this.startTime.set(editing.startTime?.slice(0, 5) ?? '08:00');
        this.endTime.set(editing.endTime?.slice(0, 5) ?? '18:00');
        this.reason.set(editing.reason ?? '');
      } else {
        this.resetForm();
      }
      this.formError.set('');
    });
  }

  isFullDayBlock(): boolean {
    return isFullDay(this.startTime(), this.endTime());
  }

  onGlobalChange(global: boolean): void {
    this.isGlobal.set(global);
    if (global) this.professionalId.set(null);
  }

  submit(): void {
    this.formError.set('');

    if (!this.type()) {
      this.formError.set('Selecione o tipo do bloqueio.');
      return;
    }
    if (!this.isGlobal() && !this.professionalId()) {
      this.formError.set('Selecione um profissional ou marque bloqueio global.');
      return;
    }
    if (this.isRecurring() && (this.weekDay() === null || this.weekDay() === undefined)) {
      this.formError.set('Selecione o dia da semana.');
      return;
    }
    if (!this.isRecurring() && !this.date()) {
      this.formError.set('Informe a data do bloqueio.');
      return;
    }
    if (!this.startTime() || !this.endTime()) {
      this.formError.set('Informe horário de início e fim.');
      return;
    }
    if (isEndBeforeStart(this.startTime(), this.endTime())) {
      this.formError.set('O horário de término deve ser posterior ao início.');
      return;
    }

    const dto: CreateScheduleBlockDTO = {
      type: this.type(),
      professionalId: this.isGlobal() ? null : this.professionalId(),
      isRecurring: this.isRecurring(),
      weekDay: this.isRecurring() ? this.weekDay() : null,
      date: this.isRecurring() ? null : this.date(),
      startTime: this.startTime(),
      endTime: this.endTime(),
      reason: this.reason().trim(),
    };

    this.save.emit(dto);
  }

  private resetForm(): void {
    this.type.set('LUNCH');
    this.isGlobal.set(false);
    this.professionalId.set(null);
    this.isRecurring.set(true);
    this.weekDay.set(1);
    this.date.set('');
    this.startTime.set('12:00');
    this.endTime.set('13:00');
    this.reason.set('');
  }
}
