import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';

interface WhatsappStatus {
  connected: boolean;
  hasQRCode: boolean;
  qrCode: string;
}

@Component({
  selector: 'app-admin-whatsapp',
  imports: [],
  templateUrl: './admin-whatsapp.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminWhatsapp implements OnInit {
  isLoading = signal(false);
  whatsappStatus = signal<WhatsappStatus | null>(null);
  isConnecting = signal(false);

  ngOnInit(): void {
    this.loadStatus();
  }

  loadStatus(): void {
    this.isLoading.set(true);
    // TODO: fetch status from API
    setTimeout(() => {
      this.whatsappStatus.set({ connected: false, hasQRCode: false, qrCode: '' });
      this.isLoading.set(false);
    }, 500);
  }

  connect(): void {
    this.isConnecting.set(true);
    // TODO: connect to WhatsApp API
  }

  disconnect(): void {
    this.isConnecting.set(true);
    // TODO: disconnect from WhatsApp API
  }

  clearSession(): void {
    this.isConnecting.set(true);
    // TODO: clear WhatsApp session
  }
}
