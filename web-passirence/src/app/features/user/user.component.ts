import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import {
  AppointmentStateService,
  AppointmentsApiService,
  ClientsApiService,
} from '../../core/services';
import { Client } from '../../core/models';
import { PhoneUtils } from '../../core/utils';
import { VALIDATION, TIME_CONFIG } from '../../core/constants';

export type PhoneLookupStatus = 'idle' | 'loading' | 'found' | 'not_found';

@Component({
  selector: 'app-user',
  imports: [FormsModule, RouterLink],
  templateUrl: './user.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly appointmentState = inject(AppointmentStateService);
  private readonly appointmentsApi = inject(AppointmentsApiService);
  private readonly clientsApi = inject(ClientsApiService);
  private readonly phoneLookup$ = new Subject<string>();

  userPhone = signal('');
  userName = signal('');
  existingClient = signal<Client | null>(null);
  phoneLookupStatus = signal<PhoneLookupStatus>('idle');
  lookupPhoneDigits = signal('');

  isSubmitting = signal(false);
  showModal = signal(false);
  isSuccess = signal(false);
  modalMessage = signal('');
  inlineError = signal('');

  ngOnInit(): void {
    this.validateAppointmentData();
    this.setupPhoneLookup();
  }

  private validateAppointmentData(): void {
    if (!this.appointmentState.isAppointmentDataComplete()) {
      this.router.navigate(['/']);
    }
  }

  private setupPhoneLookup(): void {
    this.phoneLookup$
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        tap(() => {
          this.phoneLookupStatus.set('loading');
          this.inlineError.set('');
        }),
        switchMap((phoneDigits) => {
          if (!this.isCompletePhone(phoneDigits)) {
            this.clearClientState();
            return of({ client: null as Client | null, phoneDigits });
          }

          return this.clientsApi.findByPhone(phoneDigits).pipe(
            map((client) => ({ client, phoneDigits })),
            catchError((err: Error) => {
              this.phoneLookupStatus.set('idle');
              this.inlineError.set(this.parseApiError(err, 'Erro ao verificar telefone.'));
              return of({ client: null as Client | null, phoneDigits });
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ client, phoneDigits }) => {
        if (this.lookupPhoneDigits() !== phoneDigits) return;
        if (!this.isCompletePhone(phoneDigits)) return;

        if (client) {
          this.existingClient.set(client);
          this.userName.set('');
          this.phoneLookupStatus.set('found');
          return;
        }

        this.existingClient.set(null);
        this.userName.set('');
        this.phoneLookupStatus.set('not_found');
      });
  }

  isPhoneValid(): boolean {
    return PhoneUtils.isValidForSubmit(this.userPhone());
  }

  isNameValid(): boolean {
    return this.userName().trim().length >= VALIDATION.MIN_NAME_LENGTH;
  }

  canSubmit(): boolean {
    const status = this.phoneLookupStatus();
    if (!this.isPhoneValid() || status === 'loading' || status === 'idle') return false;
    if (status === 'found') return !!this.existingClient();
    return this.isNameValid();
  }

  getPhoneError(): string | null {
    return PhoneUtils.getValidationError(this.userPhone());
  }

  formatPhone(value: string): void {
    const formatted = PhoneUtils.formatWhileTyping(value);
    this.userPhone.set(formatted);
    this.inlineError.set('');

    const phoneDigits = PhoneUtils.extractDigits(formatted);
    this.lookupPhoneDigits.set(phoneDigits);

    if (!this.isCompletePhone(phoneDigits)) {
      this.clearClientState();
      return;
    }

    this.phoneLookup$.next(phoneDigits);
  }

  onNameChange(value: string): void {
    this.userName.set(value);
    this.inlineError.set('');
  }

  getPhoneDigits(): number {
    return PhoneUtils.extractDigits(this.userPhone()).length;
  }

  changePhone(): void {
    this.userPhone.set('');
    this.clearClientState();
  }

  confirmAppointment(): void {
    if (!this.canSubmit() || this.isSubmitting()) return;

    const client = this.existingClient();
    if (client) {
      this.submitAppointment(client.id);
      return;
    }

    if (!this.isNameValid()) return;

    this.isSubmitting.set(true);
    this.inlineError.set('');

    const phoneDigits = PhoneUtils.extractDigits(this.userPhone());

    this.clientsApi.create(this.userName().trim(), phoneDigits).subscribe({
      next: (created) => this.submitAppointment(created.id),
      error: (err) => {
        this.isSubmitting.set(false);
        this.inlineError.set(this.parseApiError(err, 'Erro ao cadastrar cliente.'));
      },
    });
  }

  private clearClientState(): void {
    this.existingClient.set(null);
    this.userName.set('');
    this.phoneLookupStatus.set('idle');
  }

  private isCompletePhone(phoneDigits: string): boolean {
    const len = phoneDigits.length;
    return len >= VALIDATION.MIN_PHONE_DIGITS && len <= VALIDATION.MAX_PHONE_DIGITS;
  }

  private submitAppointment(clientId: number): void {
    const appointmentData = this.appointmentState.getAppointmentData();
    if (!appointmentData) {
      this.router.navigate(['/']);
      return;
    }

    this.isSubmitting.set(true);
    this.inlineError.set('');

    this.appointmentsApi
      .createAppointment({
        clientId,
        professionalId: Number(appointmentData.professionalId),
        serviceIds: appointmentData.serviceIds,
        date: appointmentData.date,
        startTime: appointmentData.time,
      })
      .subscribe({
        next: () => this.showSuccessMessage(),
        error: (err) => {
          this.isSubmitting.set(false);
          this.showErrorMessage(this.parseApiError(err));
        },
      });
  }

  private parseApiError(
    error: unknown,
    fallback = 'Erro ao confirmar agendamento. Tente novamente.',
  ): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error;
      if (body?.error?.message) return body.error.message;
      if (typeof body?.message === 'string') return body.message;
      if (typeof body === 'string' && body.trim()) return body;
      if (error.status === 409) return 'Horário indisponível. Escolha outro horário.';
      if (error.status === 400) return 'Dados inválidos. Verifique as informações.';
    }
    if (error instanceof Error && error.message) return error.message;
    return fallback;
  }

  private showSuccessMessage(): void {
    this.isSuccess.set(true);
    this.modalMessage.set('Seu agendamento foi confirmado com sucesso!');
    this.showModal.set(true);
    this.isSubmitting.set(false);
    this.appointmentState.clearAppointmentData();

    setTimeout(() => {
      this.closeModal();
      this.router.navigate(['/']);
    }, TIME_CONFIG.REDIRECT_DELAY);
  }

  private showErrorMessage(message?: string): void {
    this.isSuccess.set(false);
    this.modalMessage.set(message ?? 'Erro ao confirmar agendamento. Tente novamente.');
    this.showModal.set(true);
    this.isSubmitting.set(false);
  }

  closeModal(): void {
    this.showModal.set(false);
  }
}
