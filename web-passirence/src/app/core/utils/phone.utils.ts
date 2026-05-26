import { VALIDATION } from '../constants';

export class PhoneUtils {
  static extractDigits(phone: string): string {
    return phone.replace(/\D/g, '');
  }

  static formatWhileTyping(phone: string): string {
    const digits = this.extractDigits(phone);
    if (digits.length === 0) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }

  static isValidForSubmit(phone: string): boolean {
    const len = this.extractDigits(phone).length;
    return len >= VALIDATION.MIN_PHONE_DIGITS && len <= VALIDATION.MAX_PHONE_DIGITS;
  }

  static getValidationError(phone: string): string | null {
    const digits = this.extractDigits(phone);
    if (digits.length === 0) return null;
    if (digits.length < VALIDATION.MIN_PHONE_DIGITS) {
      return 'Telefone incompleto';
    }
    if (digits.length > VALIDATION.MAX_PHONE_DIGITS) {
      return 'Telefone inválido';
    }
    return null;
  }

  static addCountryCode(digits: string): string {
    const clean = this.extractDigits(digits);
    return clean.startsWith('55') ? `+${clean}` : `+55${clean}`;
  }
}
