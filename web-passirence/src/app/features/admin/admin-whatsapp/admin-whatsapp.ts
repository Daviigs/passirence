import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, takeWhile, timer } from 'rxjs';
import type { WhatsappApiStatus, WhatsappUiStatus } from '../../../core/models/whatsapp-status.model';
import { WhatsappApiService } from '../../../core/services/whatsapp-api.service';

@Component({
  selector: 'app-admin-whatsapp',
  imports: [],
  templateUrl: './admin-whatsapp.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminWhatsapp implements OnInit {
  private readonly whatsappApi = inject(WhatsappApiService);
  private readonly destroyRef = inject(DestroyRef);

  isLoading = signal(false);
  whatsappStatus = signal<WhatsappUiStatus | null>(null);
  isConnecting = signal(false);
  errorMessage = signal<string | null>(null);

  private polling = false;

  ngOnInit(): void {
    this.loadStatus();
  }

  loadStatus(): void {
    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.whatsappApi.getStatus().subscribe({
      next: (status) => {
        this.applyStatus(status);
        this.isLoading.set(false);
        this.ensurePolling(status);
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  connect(): void {
    this.errorMessage.set(null);
    this.isConnecting.set(true);

    this.whatsappApi.connect().subscribe({
      next: (status) => {
        this.applyStatus(status);
        this.isConnecting.set(false);
        this.ensurePolling(status);
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message);
        this.isConnecting.set(false);
      },
    });
  }

  disconnect(): void {
    this.errorMessage.set(null);
    this.isConnecting.set(true);
    this.polling = false;

    this.whatsappApi.logout().subscribe({
      next: () => {
        this.whatsappStatus.set(this.mapStatus({
          status: 'disconnected',
          connected: false,
          phoneNumber: null,
          profileName: null,
          qrCode: null,
        }));
        this.isConnecting.set(false);
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message);
        this.isConnecting.set(false);
      },
    });
  }

  private applyStatus(api: WhatsappApiStatus): void {
    this.whatsappStatus.set(this.mapStatus(api));
  }

  private mapStatus(api: WhatsappApiStatus): WhatsappUiStatus {
    return {
      connected: api.connected,
      hasQRCode: api.status === 'qr_pending' && !!api.qrCode,
      qrCode: api.qrCode ?? '',
      phoneNumber: api.phoneNumber,
      profileName: api.profileName,
      status: api.status,
    };
  }

  private ensurePolling(status: WhatsappApiStatus): void {
    const shouldPoll =
      !status.connected &&
      (status.status === 'qr_pending' || status.status === 'connecting');

    if (!shouldPoll) {
      this.polling = false;
      return;
    }

    if (this.polling) {
      return;
    }

    this.polling = true;

    timer(3000, 3000)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        takeWhile(() => this.polling),
        switchMap(() => this.whatsappApi.getStatus()),
      )
      .subscribe({
        next: (status) => {
          this.applyStatus(status);
          if (status.connected || status.status === 'disconnected') {
            this.polling = false;
          }
        },
        error: () => {
          this.polling = false;
        },
      });
  }
}
