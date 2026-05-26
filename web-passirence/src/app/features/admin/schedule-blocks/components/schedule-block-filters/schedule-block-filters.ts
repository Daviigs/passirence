import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Professional } from '../../../admin-profissionais/profissionais.service';
import { SCHEDULE_BLOCK_TYPE_OPTIONS } from '../../models/schedule-block.model';
import { ScheduleBlockFilters } from '../../models/schedule-block.model';

@Component({
  selector: 'app-schedule-block-filters',
  imports: [FormsModule],
  templateUrl: './schedule-block-filters.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleBlockFiltersComponent {
  professionals = input<Professional[]>([]);
  filters = input.required<ScheduleBlockFilters>();
  filtersChange = output<ScheduleBlockFilters>();
  clearFilters = output<void>();

  readonly typeOptions = SCHEDULE_BLOCK_TYPE_OPTIONS;

  readonly professionalFilterOptions = [
    { value: '', label: 'Todos profissionais' },
    { value: 'global', label: 'Somente globais' },
  ];

  readonly recurringOptions = [
    { value: '', label: 'Todos' },
    { value: 'true', label: 'Somente recorrentes' },
    { value: 'false', label: 'Somente avulsos' },
  ];

  onProfessionalChange(value: string): void {
    const next = { ...this.filters() };
    if (value === '') {
      delete next.professionalId;
    } else if (value === 'global') {
      next.professionalId = null;
    } else {
      next.professionalId = Number(value);
    }
    this.filtersChange.emit(next);
  }

  professionalSelectValue(): string {
    const id = this.filters().professionalId;
    if (id === null) return 'global';
    if (id === undefined) return '';
    return String(id);
  }

  onRecurringChange(value: string): void {
    const next = { ...this.filters() };
    if (value === '') {
      delete next.isRecurring;
    } else {
      next.isRecurring = value === 'true';
    }
    this.filtersChange.emit(next);
  }

  recurringSelectValue(): string {
    const r = this.filters().isRecurring;
    if (r === undefined) return '';
    return String(r);
  }

  onTypeChange(value: string): void {
    const next = { ...this.filters(), type: value as ScheduleBlockFilters['type'] };
    if (!value) delete next.type;
    this.filtersChange.emit(next);
  }

  onDateChange(value: string): void {
    const next = { ...this.filters() };
    if (value) next.date = value;
    else delete next.date;
    this.filtersChange.emit(next);
  }
}
