import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PhoneUtils } from '../../../../../core/utils';
import { Cliente, CreateClienteDTO } from '../../models/cliente.model';

@Component({
  selector: 'app-cliente-form',
  imports: [FormsModule],
  templateUrl: './cliente-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClienteForm {
  cliente = input<Cliente | null>(null);
  isSaving = input(false);

  save = output<CreateClienteDTO>();
  cancel = output<void>();

  nome = signal('');
  telefone = signal('');
  ativo = signal(true);
  formError = signal('');

  constructor() {
    effect(() => {
      const c = this.cliente();
      if (c) {
        this.nome.set(c.nome);
        this.telefone.set(PhoneUtils.formatWhileTyping(c.telefone));
        this.ativo.set(c.ativo);
      } else {
        this.nome.set('');
        this.telefone.set('');
        this.ativo.set(true);
      }
      this.formError.set('');
    });
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = PhoneUtils.formatWhileTyping(input.value);
    this.telefone.set(formatted);
    input.value = formatted;
  }

  submit(): void {
    this.formError.set('');
    const nome = this.nome().trim();
    const telefone = this.telefone();

    if (!nome) {
      this.formError.set('Informe o nome do cliente.');
      return;
    }
    if (!telefone.trim()) {
      this.formError.set('Informe o telefone do cliente.');
      return;
    }
    const phoneErr = PhoneUtils.getValidationError(telefone);
    if (phoneErr || !PhoneUtils.isValidForSubmit(telefone)) {
      this.formError.set(phoneErr ?? 'Telefone inválido.');
      return;
    }

    this.save.emit({
      nome,
      telefone,
      ativo: this.ativo(),
    });
  }
}
