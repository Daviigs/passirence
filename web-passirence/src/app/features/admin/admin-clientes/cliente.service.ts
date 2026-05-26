import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../core/config/api.config';
import { unwrapData } from '../../../core/http/unwrap-api';
import { PhoneUtils } from '../../../core/utils';
import {
  Cliente,
  CreateClienteDTO,
  UpdateClienteDTO,
} from './models/cliente.model';

interface ClienteApi {
  id: number;
  nome: string;
  telefone: string;
  ativo?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URL;

  listAll(): Observable<Cliente[]> {
    return this.http
      .get<ClienteApi[] | { data: ClienteApi[] }>(`${this.baseUrl}/clientes`)
      .pipe(
        map((res) => this.normalizeList(res).map((item) => this.mapCliente(item))),
        catchError((err) => throwError(() => this.toApiError(err))),
      );
  }

  listActive(): Observable<Cliente[]> {
    return this.http
      .get<ClienteApi[] | { data: ClienteApi[] }>(`${this.baseUrl}/clientes/ativos`)
      .pipe(
        map((res) => this.normalizeList(res).map((item) => this.mapCliente(item))),
        catchError((err) => throwError(() => this.toApiError(err))),
      );
  }

  create(dto: CreateClienteDTO): Observable<Cliente> {
    return this.http
      .post<ClienteApi | { data: ClienteApi }>(`${this.baseUrl}/clientes`, {
        nome: dto.nome.trim(),
        telefone: PhoneUtils.extractDigits(dto.telefone),
        ativo: dto.ativo,
      })
      .pipe(
        map((res) => this.mapCliente(this.unwrapItem(res))),
        catchError((err) => throwError(() => this.toApiError(err))),
      );
  }

  update(id: number, dto: UpdateClienteDTO): Observable<Cliente> {
    return this.http
      .put<ClienteApi | { data: ClienteApi }>(`${this.baseUrl}/clientes/${id}`, {
        nome: dto.nome.trim(),
        telefone: PhoneUtils.extractDigits(dto.telefone),
        ativo: dto.ativo,
      })
      .pipe(
        map((res) => this.mapCliente(this.unwrapItem(res))),
        catchError((err) => throwError(() => this.toApiError(err))),
      );
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/clientes/${id}`)
      .pipe(catchError((err) => throwError(() => this.toApiError(err))));
  }

  toggleStatus(id: number): Observable<void> {
    return this.http
      .patch<{ message?: string }>(`${this.baseUrl}/clientes/${id}/toggle`, null)
      .pipe(
        map(() => undefined),
        catchError((err) => throwError(() => this.toApiError(err))),
      );
  }

  private normalizeList(res: unknown): ClienteApi[] {
    if (Array.isArray(res)) return res;
    if (res !== null && typeof res === 'object' && 'data' in res) {
      const data = (res as { data: unknown }).data;
      return Array.isArray(data) ? (data as ClienteApi[]) : [];
    }
    return [];
  }

  private unwrapItem(res: ClienteApi | { data: ClienteApi }): ClienteApi {
    if (res !== null && typeof res === 'object' && 'data' in res) {
      return (res as { data: ClienteApi }).data;
    }
    return res as ClienteApi;
  }

  private mapCliente(item: ClienteApi): Cliente {
    return {
      id: item.id,
      nome: item.nome,
      telefone: item.telefone,
      ativo: item.ativo ?? true,
    };
  }

  private toApiError(err: unknown): Error {
    if (err instanceof HttpErrorResponse) {
      const body = err.error;
      if (body?.error?.message) return new Error(body.error.message);
      if (typeof body?.message === 'string') return new Error(body.message);
      if (typeof body?.error === 'string') return new Error(body.error);
    }
    if (err instanceof Error) return err;
    return new Error('Erro na comunicação com o servidor');
  }
}
