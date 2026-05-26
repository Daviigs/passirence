import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClienteTableRow } from '../cliente-table/cliente-table';
import { ClienteStatusBadge } from '../cliente-status-badge/cliente-status-badge';
import { formatPhoneDisplay, getClienteInitials } from '../../cliente.utils';
import { Cliente } from '../../models/cliente.model';

@Component({
  selector: 'app-cliente-card',
  imports: [RouterLink, ClienteStatusBadge],
  templateUrl: './cliente-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClienteCard {
  row = input.required<ClienteTableRow>();

  edit = output<Cliente>();
  toggle = output<Cliente>();
  remove = output<Cliente>();

  initials = () => getClienteInitials(this.row().nome);
  phone = () => formatPhoneDisplay(this.row().telefone);
}
