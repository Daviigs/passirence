import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Professional } from '../../../admin-profissionais/profissionais.service';
import {
  AppointmentFilters,
  AppointmentPeriodFilter,
  AppointmentStatusFilter,
} from '../../models/appointment-view.model';

@Component({
  selector: 'app-appointment-filters-panel',
  imports: [FormsModule],
  templateUrl: './appointment-filters.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentFiltersPanel {
  professionals = input<Professional[]>([]);
  filters = input.required<AppointmentFilters>();
  filtersChange = output<AppointmentFilters>();
  clearFilters = output<void>();

  readonly statusOptions: { value: AppointmentStatusFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'scheduled', label: 'Agendado' },
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'pending', label: 'Pendente' },
    { value: 'cancelled', label: 'Cancelado' },
    { value: 'completed', label: 'Finalizado' },
  ];

  readonly periodOptions: { value: AppointmentPeriodFilter; label: string }[] = [
    { value: 'today', label: 'Hoje' },
    { value: 'tomorrow', label: 'Amanhã' },
    { value: 'week', label: 'Semana' },
    { value: 'month', label: 'Mês' },
  ];

  patch(partial: Partial<AppointmentFilters>): void {
    this.filtersChange.emit({ ...this.filters(), ...partial });
  }

  professionalValue(): string {
    const id = this.filters().professionalId;
    return id === null ? '' : String(id);
  }

  onProfessionalChange(value: string): void {
    this.patch({ professionalId: value ? Number(value) : null });
  }
}
