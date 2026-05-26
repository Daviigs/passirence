import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Cliente } from '../../models/cliente.model';
import { ClienteStatusBadge } from '../cliente-status-badge/cliente-status-badge';
import { formatPhoneDisplay, getClienteInitials } from '../../cliente.utils';

export interface ClienteTableRow extends Cliente {
  lastAppointmentLabel: string;
}

@Component({
  selector: 'app-cliente-table',
  imports: [RouterLink, ClienteStatusBadge],
  templateUrl: './cliente-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClienteTable {
  rows = input<ClienteTableRow[]>([]);
  isLoading = input(false);

  edit = output<Cliente>();
  toggle = output<Cliente>();
  remove = output<Cliente>();

  initials = (nome: string) => getClienteInitials(nome);
  phone = (tel: string) => formatPhoneDisplay(tel);
}
