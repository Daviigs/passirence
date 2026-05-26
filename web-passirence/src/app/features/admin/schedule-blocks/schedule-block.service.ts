import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../core/config/api.config';
import { unwrapData } from '../../../core/http/unwrap-api';
import {
  CreateScheduleBlockDTO,
  ScheduleBlock,
  ScheduleBlockFilters,
  ScheduleBlockType,
  UpdateScheduleBlockDTO,
} from './models/schedule-block.model';

interface ScheduleBlockApi {
  id: number;
  professionalId?: number | null;
  type: ScheduleBlockType;
  isRecurring: boolean;
  weekday?: number | null;
  weekDay?: number | null;
  date?: string | null;
  startTime: string;
  endTime: string;
  reason: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class ScheduleBlockService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URL;

  list(filters: ScheduleBlockFilters = {}): Observable<ScheduleBlock[]> {
    let params = new HttpParams();

    if (filters.professionalId !== undefined && filters.professionalId !== null) {
      params = params.set('professionalId', String(filters.professionalId));
    }
    if (filters.date) {
      params = params.set('date', filters.date);
    }
    if (filters.isRecurring !== undefined) {
      params = params.set('isRecurring', String(filters.isRecurring));
    }
    if (filters.type) {
      params = params.set('type', filters.type);
    }

    return this.http
      .get<ScheduleBlockApi[] | { data: ScheduleBlockApi[] }>(
        `${this.baseUrl}/schedule-blocks`,
        { params },
      )
      .pipe(
        unwrapData<ScheduleBlockApi[]>(),
        map((items) => (Array.isArray(items) ? items.map((item) => this.mapFromApi(item)) : [])),
        catchError((err) => throwError(() => this.toApiError(err))),
      );
  }

  getById(id: number): Observable<ScheduleBlock> {
    return this.http
      .get<ScheduleBlockApi | { data: ScheduleBlockApi }>(`${this.baseUrl}/schedule-blocks/${id}`)
      .pipe(
        unwrapData<ScheduleBlockApi>(),
        map((item) => this.mapFromApi(item)),
        catchError((err) => throwError(() => this.toApiError(err))),
      );
  }

  create(dto: CreateScheduleBlockDTO): Observable<ScheduleBlock> {
    return this.http
      .post<ScheduleBlockApi | { data: ScheduleBlockApi }>(
        `${this.baseUrl}/schedule-blocks`,
        this.mapToApi(dto),
      )
      .pipe(
        unwrapData<ScheduleBlockApi>(),
        map((item) => this.mapFromApi(item)),
        catchError((err) => throwError(() => this.toApiError(err))),
      );
  }

  update(id: number, dto: UpdateScheduleBlockDTO): Observable<ScheduleBlock> {
    return this.http
      .put<ScheduleBlockApi | { data: ScheduleBlockApi }>(
        `${this.baseUrl}/schedule-blocks/${id}`,
        this.mapToApi(dto),
      )
      .pipe(
        unwrapData<ScheduleBlockApi>(),
        map((item) => this.mapFromApi(item)),
        catchError((err) => throwError(() => this.toApiError(err))),
      );
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/schedule-blocks/${id}`)
      .pipe(catchError((err) => throwError(() => this.toApiError(err))));
  }

  private mapFromApi(item: ScheduleBlockApi): ScheduleBlock {
    return {
      id: item.id,
      professionalId: item.professionalId ?? null,
      type: item.type,
      isRecurring: item.isRecurring,
      weekDay: item.weekday ?? item.weekDay ?? null,
      date: item.date ?? null,
      startTime: item.startTime,
      endTime: item.endTime,
      reason: item.reason,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private mapToApi(dto: CreateScheduleBlockDTO): Record<string, unknown> {
    const body: Record<string, unknown> = {
      type: dto.type,
      isRecurring: dto.isRecurring,
      startTime: dto.startTime,
      endTime: dto.endTime,
      reason: dto.reason?.trim() ?? '',
      professionalId: dto.professionalId ?? null,
    };

    if (dto.isRecurring) {
      body['weekday'] = dto.weekDay ?? null;
      body['date'] = null;
    } else {
      body['date'] = dto.date ?? null;
      body['weekday'] = null;
    }

    return body;
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
}
