import { map } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';

export function unwrapData<T>() {
  return map((res: T | ApiResponse<T>): T => {
    if (res !== null && typeof res === 'object' && 'error' in res) {
      const err = res as { error?: { message?: string } };
      throw new Error(err.error?.message ?? 'Erro na requisição');
    }
    if (res !== null && typeof res === 'object' && 'data' in res) {
      return (res as ApiResponse<T>).data;
    }
    return res as T;
  });
}

export function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  return [];
}
