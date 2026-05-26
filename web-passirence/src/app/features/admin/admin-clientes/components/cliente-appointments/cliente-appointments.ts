import { ChangeDetectionStrategy, Component, input } from '@angular/core';
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
    if (status === 'completed' || status === 'finished') return 'bg-[#0066ff]/15 text-[#0066ff] border-[#0066ff]/35';
    if (status === 'confirmed' || status === 'scheduled') return 'bg-green-500/15 text-green-400 border-green-500/30';
    if (status === 'cancelled' || status === 'canceled') return 'bg-white/5 text-white/40 border-white/10';
    return 'bg-yellow-600/15 text-yellow-600 border-yellow-600/30';
  }
}
