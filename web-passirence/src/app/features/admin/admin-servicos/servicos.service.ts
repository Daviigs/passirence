import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';
import { unwrapData } from '../../../core/http/unwrap-api';

export interface Servico {
  id: number;
  nome: string;
  duracao: number;
  preco: number;
}

@Injectable({ providedIn: 'root' })
export class ServicosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URL;

  getServicos(): Observable<Servico[]> {
    return this.http
      .get<Servico[] | { data: Servico[] }>(`${this.baseUrl}/servicos`)
      .pipe(unwrapData<Servico[]>());
  }

  createServico(data: Omit<Servico, 'id'>): Observable<Servico> {
    return this.http
      .post<Servico | { data: Servico }>(`${this.baseUrl}/servicos`, data)
      .pipe(unwrapData<Servico>());
  }

  updateServico(id: number, data: Omit<Servico, 'id'>): Observable<Servico> {
    return this.http
      .put<Servico | { data: Servico }>(`${this.baseUrl}/servicos/${id}`, data)
      .pipe(unwrapData<Servico>());
  }

  deleteServico(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/servicos/${id}`);
  }
}
