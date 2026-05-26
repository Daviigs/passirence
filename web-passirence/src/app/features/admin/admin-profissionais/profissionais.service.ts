import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';
import { unwrapData } from '../../../core/http/unwrap-api';

export interface Professional {
  id: number;
  nome: string;
  telefone: string;
  ativo: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProfissionaisService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URL;

  getProfessionals(): Observable<Professional[]> {
    return this.http
      .get<Professional[] | { data: Professional[] }>(`${this.baseUrl}/profissionais`)
      .pipe(unwrapData<Professional[]>());
  }

  createProfessional(data: { nome: string; telefone: string; ativo: boolean }): Observable<Professional> {
    return this.http
      .post<Professional | { data: Professional }>(`${this.baseUrl}/profissionais`, data)
      .pipe(unwrapData<Professional>());
  }

  updateProfessional(
    id: number,
    data: { nome: string; telefone: string; ativo: boolean },
  ): Observable<Professional> {
    return this.http
      .put<Professional | { data: Professional }>(`${this.baseUrl}/profissionais/${id}`, data)
      .pipe(unwrapData<Professional>());
  }

  deleteProfessional(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/profissionais/${id}`);
  }

  toggleProfessionalStatus(id: number, ativo: boolean): Observable<{ message: string }> {
    return this.http
      .patch<{ message: string } | { data: { message: string } }>(
        `${this.baseUrl}/profissionais/${id}/toggle`,
        { ativo },
      )
      .pipe(unwrapData<{ message: string }>());
  }
}
