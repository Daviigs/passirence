import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Subject, catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { ClientsApiService } from '../../core/services';
import { PhoneUtils } from '../../core/utils';
import { VALIDATION } from '../../core/constants';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly clientsApi = inject(ClientsApiService);
  private readonly phoneLookup$ = new Subject<string>();

  showPhoneModal = signal(false);
  userPhone = signal('');
  isLookingUp = signal(false);
  lookupError = signal('');
  lookupPhoneDigits = signal('');

  constructor() {
    this.setupPhoneLookup();
  }

  private setupPhoneLookup(): void {
    this.phoneLookup$
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        tap(() => {
          this.isLookingUp.set(true);
          this.lookupError.set('');
        }),
        switchMap((phoneDigits) => {
          if (!this.isCompletePhone(phoneDigits)) {
            this.isLookingUp.set(false);
            return of({ client: null, phoneDigits });
          }

          return this.clientsApi.findByPhone(phoneDigits).pipe(
            map((client) => ({ client, phoneDigits })),
            catchError((err: Error) => {
              this.isLookingUp.set(false);
              this.lookupError.set(err.message || 'Erro ao buscar cadastro.');
              return of({ client: null, phoneDigits });
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ client, phoneDigits }) => {
        this.isLookingUp.set(false);
        if (this.lookupPhoneDigits() !== phoneDigits) return;
        if (!this.isCompletePhone(phoneDigits)) return;

        if (!client) {
          this.lookupError.set('Telefone não cadastrado. Faça um agendamento primeiro.');
          return;
        }

        this.closePhoneModal();
        this.router.navigate(['/meus-agendamentos'], {
          queryParams: { clientId: client.id },
          state: { clientId: client.id, clientName: client.name },
        });
      });
  }

  openPhoneModal(): void {
    this.lookupError.set('');
    this.userPhone.set('');
    this.lookupPhoneDigits.set('');
    this.showPhoneModal.set(true);
  }

  closePhoneModal(): void {
    this.showPhoneModal.set(false);
    this.userPhone.set('');
    this.lookupPhoneDigits.set('');
    this.lookupError.set('');
    this.isLookingUp.set(false);
  }

  formatPhone(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = PhoneUtils.formatWhileTyping(input.value);
    input.value = formatted;
    this.userPhone.set(formatted);
    this.lookupError.set('');

    const phoneDigits = PhoneUtils.extractDigits(formatted);
    this.lookupPhoneDigits.set(phoneDigits);
  }

  getPhoneDigits(): string {
    return PhoneUtils.extractDigits(this.userPhone());
  }

  isPhoneValid(): boolean {
    return PhoneUtils.isValidForSubmit(this.userPhone());
  }

  viewAppointments(): void {
    const digits = this.getPhoneDigits();
    if (!this.isCompletePhone(digits) || this.isLookingUp()) return;
    this.phoneLookup$.next(digits);
  }

  private isCompletePhone(phoneDigits: string): boolean {
    const len = phoneDigits.length;
    return len >= VALIDATION.MIN_PHONE_DIGITS && len <= VALIDATION.MAX_PHONE_DIGITS;
  }
}
