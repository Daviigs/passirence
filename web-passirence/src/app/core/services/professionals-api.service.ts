import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { unwrapData } from '../http/unwrap-api';
import { Professional } from '../models';

interface ProfissionalApi {
  id: number;
  nome: string;
  telefone: string;
  ativo: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProfessionalsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URL;

  getActive(_serviceIds?: number[]): Observable<Professional[]> {
    return this.http
      .get<ProfissionalApi[] | { data: ProfissionalApi[] }>(
        `${this.baseUrl}/profissionais/ativos`,
      )
      .pipe(
        unwrapData<ProfissionalApi[]>(),
        map((items) =>
          (items ?? []).map((item) => ({
            id: item.id,
            professionalName: item.nome,
            professionalEmail: '',
            professionalPhone: item.telefone,
            active: item.ativo ?? true,
          })),
        ),
      );
  }
}
