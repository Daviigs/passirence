import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { WHATSAPP_API_BASE_URL, WHATSAPP_API_KEY } from '../config/whatsapp-api.config';
import { unwrapData } from '../http/unwrap-api';
import type { WhatsappApiStatus } from '../models/whatsapp-status.model';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class WhatsappApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = WHATSAPP_API_BASE_URL;
  private readonly headers = this.buildHeaders();

  getStatus(): Observable<WhatsappApiStatus> {
    return this.http
      .get<ApiEnvelope<WhatsappApiStatus>>(`${this.baseUrl}/whatsapp/status`, {
        headers: this.headers,
      })
      .pipe(
        unwrapData<WhatsappApiStatus>(),
        catchError((err) => throwError(() => this.toApiError(err))),
      );
  }

  connect(): Observable<WhatsappApiStatus> {
    return this.http
      .post<ApiEnvelope<WhatsappApiStatus>>(`${this.baseUrl}/whatsapp/connect`, {}, {
        headers: this.headers,
      })
      .pipe(
        unwrapData<WhatsappApiStatus>(),
        catchError((err) => throwError(() => this.toApiError(err))),
      );
  }

  logout(): Observable<void> {
    return this.http
      .post<{ success: boolean; message?: string }>(
        `${this.baseUrl}/whatsapp/logout`,
        {},
        { headers: this.headers },
      )
      .pipe(
        map(() => undefined),
        catchError((err) => throwError(() => this.toApiError(err))),
      );
  }

  private buildHeaders(): HttpHeaders | undefined {
    if (!WHATSAPP_API_KEY) {
      return undefined;
    }
    return new HttpHeaders({ 'X-API-Key': WHATSAPP_API_KEY });
  }

  private toApiError(err: HttpErrorResponse): Error {
    const body = err.error as { error?: string; message?: string } | null;
    const message =
      body?.error ?? body?.message ?? err.message ?? 'Erro ao comunicar com a API WhatsApp';
    return new Error(message);
  }
}
