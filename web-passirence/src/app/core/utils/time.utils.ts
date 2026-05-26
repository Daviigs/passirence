export class TimeUtils {
  static formatToShort(time: string): string {
    if (/^\d{2}:\d{2}$/.test(time)) return time;
    const match = time.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      return `${match[1].padStart(2, '0')}:${match[2]}`;
    }
    return time;
  }
}
