import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppointmentsApiService } from '../../../../../core/services';
import { AdminAppointment, CreateAppointmentPayload, UpdateAppointmentPayload } from '../../../../../core/models';
import { Cliente } from '../../../admin-clientes/models/cliente.model';
import { Professional } from '../../../admin-profissionais/profissionais.service';
import { Servico } from '../../../admin-servicos/servicos.service';
import { AvailableTimes } from '../available-times/available-times';
import { isAppointmentEditable } from '../../appointment.utils';

export type AppointmentFormSave =
  | { mode: 'create'; payload: CreateAppointmentPayload }
  | { mode: 'update'; id: number; payload: UpdateAppointmentPayload };

@Component({
  selector: 'app-appointment-form',
  imports: [FormsModule, AvailableTimes],
  templateUrl: './appointment-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentForm {
  private readonly appointmentsApi = inject(AppointmentsApiService);

  appointment = input<AdminAppointment | null>(null);
  clients = input<Cliente[]>([]);
  professionals = input<Professional[]>([]);
  services = input<Servico[]>([]);
  availableDates = input<string[]>([]);
  isSaving = input(false);

  save = output<AppointmentFormSave>();
  cancelled = output<void>();

  clientId = signal<number | null>(null);
  professionalId = signal<number | null>(null);
  selectedServiceIds = signal<number[]>([]);
  date = signal('');
  startTime = signal('');
  status = signal('scheduled');
  availableTimes = signal<string[]>([]);
  loadingTimes = signal(false);
  formError = signal('');

  isEditMode = () => this.appointment() !== null;
  canEdit = () => {
    const apt = this.appointment();
    return !apt || isAppointmentEditable(apt.status);
  };

  constructor() {
    effect(() => {
      const apt = this.appointment();
      if (apt) {
        this.clientId.set(apt.clientId);
        this.professionalId.set(apt.professionalId);
        this.selectedServiceIds.set(apt.serviceIds ?? []);
        this.date.set(apt.date);
        this.startTime.set(apt.startTime?.slice(0, 5) ?? '');
        this.status.set(apt.status);
      } else {
        this.clientId.set(null);
        this.professionalId.set(null);
        this.selectedServiceIds.set([]);
        this.date.set('');
        this.startTime.set('');
        this.status.set('scheduled');
      }
      this.formError.set('');
    });

    effect(() => {
      const d = this.date();
      const p = this.professionalId();
      const s = this.selectedServiceIds();
      const apt = this.appointment();
      if (d && p && s.length > 0) {
        this.loadTimes(d, p, s, apt?.id);
      } else {
        this.availableTimes.set([]);
        if (!apt) this.startTime.set('');
      }
    });
  }

  toggleService(id: number): void {
    if (!this.canEdit()) return;
    const current = this.selectedServiceIds();
    if (current.includes(id)) {
      this.selectedServiceIds.set(current.filter((x) => x !== id));
    } else {
      this.selectedServiceIds.set([...current, id]);
    }
  }

  isServiceSelected(id: number): boolean {
    return this.selectedServiceIds().includes(id);
  }

  submit(): void {
    this.formError.set('');
    if (!this.clientId()) {
      this.formError.set('Selecione o cliente.');
      return;
    }
    if (!this.professionalId()) {
      this.formError.set('Selecione o profissional.');
      return;
    }
    if (this.selectedServiceIds().length === 0) {
      this.formError.set('Selecione ao menos um serviço.');
      return;
    }
    if (!this.date()) {
      this.formError.set('Selecione a data.');
      return;
    }
    if (!this.startTime()) {
      this.formError.set('Selecione o horário.');
      return;
    }

    const base = {
      clientId: this.clientId()!,
      professionalId: this.professionalId()!,
      serviceIds: this.selectedServiceIds(),
      date: this.date(),
      startTime: this.startTime(),
    };

    const editing = this.appointment();
    if (editing) {
      this.save.emit({
        mode: 'update',
        id: editing.id,
        payload: { ...base, status: this.status() },
      });
      return;
    }

    this.save.emit({ mode: 'create', payload: base });
  }

  private loadTimes(
    date: string,
    professionalId: number,
    serviceIds: number[],
    excludeAppointmentId?: number,
  ): void {
    this.loadingTimes.set(true);
    this.appointmentsApi.getAvailableTimes(date, professionalId, serviceIds).subscribe({
      next: (times) => {
        let slots = times;
        const current = this.startTime()?.slice(0, 5);
        if (current && !slots.includes(current) && this.appointment()?.id === excludeAppointmentId) {
          slots = [...slots, current].sort();
        }
        this.availableTimes.set(slots);
        if (current && slots.includes(current)) {
          this.startTime.set(current);
        } else if (!slots.includes(this.startTime())) {
          this.startTime.set(slots[0] ?? '');
        }
        this.loadingTimes.set(false);
      },
      error: () => {
        this.availableTimes.set([]);
        this.loadingTimes.set(false);
      },
    });
  }
}
