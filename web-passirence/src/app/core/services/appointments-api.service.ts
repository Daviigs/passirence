import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';
import { asStringArray, unwrapData } from '../http/unwrap-api';
import {
  AdminAppointment,
  AppointmentCreated,
  AppointmentListFilters,
  AppointmentServiceItem,
  ClientAppointment,
  CreateAppointmentPayload,
  UpdateAppointmentPayload,
} from '../models';

interface AppointmentServiceApi {
  id: number;
  name: string;
  durationMinutes?: number;
  nome?: string;
  duracao?: number;
}

interface AppointmentApi {
  id: number;
  clientId?: number;
  professionalId?: number;
  serviceIds?: number[];
  date?: string;
  status?: string;
  startTime: string;
  endTime?: string;
  professionalName?: string;
  professional?: { nome: string };
  clientName?: string;
  client?: { nome: string; telefone: string };
  userName?: string;
  userPhone?: string;
  clientPhone?: string;
  services?: (string | AppointmentServiceApi)[];
  servicos?: { nome: string; id?: number }[];
}

@Injectable({ providedIn: 'root' })
export class AppointmentsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URL;

  getAvailableDates(): Observable<string[]> {
    return this.http
      .get<string[] | { data: string[] }>(`${this.baseUrl}/appointments/available-dates`)
      .pipe(
        unwrapData<string[]>(),
        map((data) => asStringArray(data)),
        catchError((err) => throwError(() => this.toApiError(err))),
      );
  }

  getAvailableTimes(
    date: string,
    professionalId: number,
    serviceIds: number[],
    excludeAppointmentId?: number,
  ): Observable<string[]> {
    let params = new HttpParams()
      .set('date', date)
      .set('professionalId', String(professionalId));

    if (serviceIds.length > 0) {
      params = params.set('serviceIds', serviceIds.join(','));
    }
    if (excludeAppointmentId != null && excludeAppointmentId > 0) {
      params = params.set('excludeAppointmentId', String(excludeAppointmentId));
    }

    return this.http
      .get<string[] | { data: string[] }>(`${this.baseUrl}/appointments/available-times`, {
        params,
      })
      .pipe(
        unwrapData<string[]>(),
        map((data) => asStringArray(data)),
        catchError((err) => throwError(() => this.toApiError(err))),
      );
  }

  list(filters: AppointmentListFilters = {}): Observable<AdminAppointment[]> {
    let params = new HttpParams();
    if (filters.date) params = params.set('date', filters.date);
    if (filters.professionalId != null) {
      params = params.set('professionalId', String(filters.professionalId));
    }
    if (filters.clientId != null) params = params.set('clientId', String(filters.clientId));
    if (filters.status) params = params.set('status', filters.status);

    return this.http
      .get<AppointmentApi[] | { data: AppointmentApi[] }>(`${this.baseUrl}/appointments`, {
        params,
      })
      .pipe(
        unwrapData<AppointmentApi[]>(),
        map((items) => (Array.isArray(items) ? items : []).map((item) => this.mapAdminAppointment(item))),
        catchError((err) => throwError(() => this.toApiError(err))),
      );
  }

  getById(id: number): Observable<AdminAppointment> {
    return this.http
      .get<AppointmentApi | { data: AppointmentApi }>(`${this.baseUrl}/appointments/${id}`)
      .pipe(
        unwrapData<AppointmentApi>(),
        map((item) => this.mapAdminAppointment(item)),
        catchError((err) => throwError(() => this.toApiError(err))),
      );
  }

  createAppointment(payload: CreateAppointmentPayload): Observable<AppointmentCreated> {
    return this.http
      .post<AppointmentCreated | { data: AppointmentCreated }>(
        `${this.baseUrl}/appointments`,
        payload,
      )
      .pipe(
        unwrapData<AppointmentCreated>(),
        catchError((err) => throwError(() => this.toApiError(err))),
      );
  }

  updateAppointment(id: number, payload: UpdateAppointmentPayload): Observable<AdminAppointment> {
    return this.http
      .put<AppointmentApi | { data: AppointmentApi }>(`${this.baseUrl}/appointments/${id}`, payload)
      .pipe(
        unwrapData<AppointmentApi>(),
        map((item) => this.mapAdminAppointment(item)),
        catchError((err) => throwError(() => this.toApiError(err))),
      );
  }

  cancelAppointment(id: number): Observable<AdminAppointment> {
    return this.http
      .patch<AppointmentApi | { data: AppointmentApi }>(
        `${this.baseUrl}/appointments/${id}/cancel`,
        null,
      )
      .pipe(
        unwrapData<AppointmentApi>(),
        map((item) => this.mapAdminAppointment(item)),
        catchError((err) => throwError(() => this.toApiError(err))),
      );
  }

  finishAppointment(id: number): Observable<AdminAppointment> {
    return this.http
      .patch<AppointmentApi | { data: AppointmentApi }>(
        `${this.baseUrl}/appointments/${id}/finish`,
        null,
      )
      .pipe(
        unwrapData<AppointmentApi>(),
        map((item) => this.mapAdminAppointment(item)),
        catchError((err) => throwError(() => this.toApiError(err))),
      );
  }

  getByDate(date: string, filters: Omit<AppointmentListFilters, 'date'> = {}): Observable<AdminAppointment[]> {
    return this.list({ ...filters, date });
  }

  getByClientId(clientId: number): Observable<ClientAppointment[]> {
    return this.list({ clientId }).pipe(
      map((items) =>
        items.map((item) => ({
          id: item.id,
          clientId: item.clientId,
          professionalId: item.professionalId,
          serviceIds: item.serviceIds,
          date: item.date,
          startTime: item.startTime,
          endTime: item.endTime,
          status: item.status,
        })),
      ),
    );
  }

  private mapAdminAppointment(item: AppointmentApi): AdminAppointment {
    const { serviceItems, serviceNames } = this.parseServices(item);

    return {
      id: item.id,
      clientId: item.clientId ?? 0,
      professionalId: item.professionalId ?? 0,
      serviceIds: item.serviceIds ?? serviceItems.map((s) => s.id),
      date: item.date ?? '',
      status: item.status ?? 'scheduled',
      startTime: item.startTime,
      endTime: item.endTime ?? item.startTime,
      professionalName: item.professionalName ?? item.professional?.nome,
      clientName: item.clientName ?? item.client?.nome ?? item.userName ?? '',
      clientPhone: item.clientPhone ?? item.client?.telefone ?? item.userPhone ?? '',
      services: serviceNames,
      serviceItems,
    };
  }

  private parseServices(item: AppointmentApi): {
    serviceItems: AppointmentServiceItem[];
    serviceNames: string[];
  } {
    const raw = item.services ?? item.servicos ?? [];
    const serviceItems: AppointmentServiceItem[] = [];
    const serviceNames: string[] = [];

    for (const s of raw) {
      if (typeof s === 'string') {
        serviceNames.push(s);
        continue;
      }
      const api = s as AppointmentServiceApi;
      const name = api.name ?? api.nome ?? `Serviço #${api.id}`;
      serviceItems.push({
        id: api.id,
        name,
        durationMinutes: api.durationMinutes ?? api.duracao,
      });
      serviceNames.push(name);
    }

    return { serviceItems, serviceNames };
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
