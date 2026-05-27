import { map } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';

export function unwrapData<T>() {
  return map((res: T | ApiResponse<T>): T => {
    if (res !== null && typeof res === 'object' && 'success' in res) {
      const envelope = res as { success?: boolean; error?: string; data?: T };
      if (envelope.success === false) {
        throw new Error(envelope.error ?? 'Erro na requisição');
      }
      if (envelope.data !== undefined) {
        return envelope.data;
      }
    }
    if (res !== null && typeof res === 'object' && 'error' in res) {
      const err = res as { error?: { message?: string } | string };
      const message =
        typeof err.error === 'string'
          ? err.error
          : (err.error?.message ?? 'Erro na requisição');
      throw new Error(message);
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
