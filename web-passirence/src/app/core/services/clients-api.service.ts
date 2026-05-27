import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';
import { unwrapData } from '../http/unwrap-api';
import { Client } from '../models';
import { PhoneUtils } from '../utils';

interface ClienteApi {
  id: number;
  nome: string;
  telefone: string;
  ativo?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ClientsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URL;

  findByPhone(phone: string): Observable<Client | null> {
    const telefone = PhoneUtils.extractDigits(phone);
    const params = new HttpParams().set('telefone', telefone);

    return this.http
      .get<{ data: ClienteApi }>(`${this.baseUrl}/clientes/by-phone`, { params })
      .pipe(
        unwrapData<ClienteApi>(),
        map((item) => this.mapClient(item, telefone)),
        catchError((err: HttpErrorResponse) => {
          if (err.status === 404) {
            return of(null);
          }
          return throwError(() => this.toApiError(err));
        }),
      );
  }

  create(name: string, phone: string): Observable<Client> {
    const telefone = PhoneUtils.extractDigits(phone);
    return this.http
      .post<ClienteApi | { data: ClienteApi }>(`${this.baseUrl}/clientes`, {
        nome: name.trim(),
        telefone,
        ativo: true,
      })
      .pipe(
        unwrapData<ClienteApi>(),
        map((item) => this.mapClient(item, telefone)),
        catchError((err) => throwError(() => this.toApiError(err))),
      );
  }

  private toApiError(err: unknown): Error {
    if (err instanceof HttpErrorResponse) {
      const body = err.error;
      if (body?.error?.message) return new Error(body.error.message);
      if (typeof body?.message === 'string') return new Error(body.message);
    }
    if (err instanceof Error) return err;
    return new Error('Erro na comunicação com o servidor');
  }

  private mapClient(item: ClienteApi, expectedDigits: string): Client {
    const clientDigits = PhoneUtils.extractDigits(item.telefone);
    if (clientDigits !== expectedDigits) {
      throw new Error('Resposta inconsistente do servidor');
    }
    return {
      id: item.id,
      name: item.nome,
      phone: clientDigits,
      active: item.ativo ?? true,
    };
  }
}
