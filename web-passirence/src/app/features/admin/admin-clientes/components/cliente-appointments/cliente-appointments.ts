import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { normalizeAppointmentStatus } from '../../../../../core/models/appointment-status';
import { ClienteAppointmentView } from '../../models/cliente.model';
import { formatAppointmentDate } from '../../cliente.utils';

@Component({
  selector: 'app-cliente-appointments',
  templateUrl: './cliente-appointments.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClienteAppointments {
  appointments = input<ClienteAppointmentView[]>([]);
  isLoading = input(false);

  formatDate = (date: string) => formatAppointmentDate(date);
  formatTime = (time: string) => time?.slice(0, 5) ?? '--:--';

  statusClass(status: string): string {
    const normalized = normalizeAppointmentStatus(status);
    if (normalized === 'completed') return 'bg-[#0066ff]/15 text-[#0066ff] border-[#0066ff]/35';
    if (normalized === 'scheduled') return 'bg-green-500/15 text-green-400 border-green-500/30';
    return 'bg-white/5 text-white/40 border-white/10';
  }
}
