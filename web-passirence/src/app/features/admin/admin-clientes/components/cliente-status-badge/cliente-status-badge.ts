import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-cliente-status-badge',
  templateUrl: './cliente-status-badge.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClienteStatusBadge {
  ativo = input(true);
}
