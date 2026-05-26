import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';
import { unwrapData } from '../../../core/http/unwrap-api';

export interface BusinessHour {
  weekday: number;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}

export interface Settings {
  timezone: string;
  slotInterval: number;
  reminderMinutes: number;
  businessHours: BusinessHour[];
}

export interface SettingsPayload {
  timezone: string;
  slotInterval: number;
  reminderMinutes: number;
  businessHours: BusinessHour[];
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = API_BASE_URL;

  getSettings(): Observable<Settings> {
    return this.http
      .get<Settings | { data: Settings }>(`${this.baseUrl}/settings`)
      .pipe(unwrapData<Settings>());
  }

  updateSettings(payload: SettingsPayload): Observable<Settings> {
    return this.http
      .put<Settings | { data: Settings }>(`${this.baseUrl}/settings`, payload)
      .pipe(unwrapData<Settings>());
  }
}
