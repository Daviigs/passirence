import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import { unwrapData } from '../http/unwrap-api';
import { Service } from '../models';

interface ServicoApi {
  id: number;
  nome: string;
  duracao: number;
  preco: number;
}

@Injectable({ providedIn: 'root' })
export class ServicesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URL;

  getServices(): Observable<Service[]> {
    return this.http.get<ServicoApi[] | { data: ServicoApi[] }>(`${this.baseUrl}/servicos`).pipe(
      unwrapData<ServicoApi[]>(),
      map((items) =>
        (items ?? []).map((item) => ({
          id: item.id,
          name: item.nome,
          duration: item.duracao,
          price: item.preco,
        })),
      ),
    );
  }
}
