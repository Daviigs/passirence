import { DAY_NAMES_SHORT, MONTH_NAMES_SHORT } from '../constants';

export class DateUtils {
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static formatToISO(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  static parseISODate(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  }

  static getDayNameShort(date: Date): string {
    return DAY_NAMES_SHORT[date.getDay()];
  }

  static getMonthNameShort(date: Date): string {
    return MONTH_NAMES_SHORT[date.getMonth()];
  }

  static formatToLongBrazilian(dateStr: string): string {
    const date = this.parseISODate(dateStr);
    const day = date.getDate();
    const month = MONTH_NAMES_SHORT[date.getMonth()];
    const year = date.getFullYear();
    const weekday = DAY_NAMES_SHORT[date.getDay()];
    return `${weekday}, ${day} ${month} ${year}`;
  }

  static formatTodayHeader(): string {
    const formatted = new Date().toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
    });
    const [day, month] = formatted.split(' de ');
    const monthCapitalized = month
      ? month.charAt(0).toUpperCase() + month.slice(1)
      : month;
    return `Hoje, ${day} de ${monthCapitalized}`;
  }

  static toDateTime(isoDate: string, time: string): Date {
    const date = this.parseISODate(isoDate);
    const [hours, minutes] = time.split(':').map(Number);
    date.setHours(hours, minutes ?? 0, 0, 0);
    return date;
  }
}
