import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Cliente } from '../../models/cliente.model';
import { ClienteStatusBadge } from '../cliente-status-badge/cliente-status-badge';
import { formatPhoneDisplay, getClienteInitials } from '../../cliente.utils';

@Component({
  selector: 'app-cliente-details',
  imports: [ClienteStatusBadge],
  templateUrl: './cliente-details.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClienteDetails {
  cliente = input.required<Cliente>();
  edit = output<void>();
  back = output<void>();

  initials = () => getClienteInitials(this.cliente().nome);
  phone = () => formatPhoneDisplay(this.cliente().telefone);
}
