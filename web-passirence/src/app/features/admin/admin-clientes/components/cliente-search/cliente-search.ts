import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cliente-search',
  imports: [FormsModule],
  templateUrl: './cliente-search.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClienteSearch {
  value = input('');
  searchChange = output<string>();
}
