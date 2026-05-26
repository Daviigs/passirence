import { Injectable } from '@angular/core';
import { AppointmentData } from '../models';

@Injectable({ providedIn: 'root' })
export class AppointmentStateService {
  private appointmentData: AppointmentData | null = null;

  getAppointmentData(): AppointmentData | null {
    return this.appointmentData;
  }

  setAppointmentData(data: AppointmentData): void {
    this.appointmentData = data;
  }

  clear(): void {
    this.appointmentData = null;
  }

  clearAppointmentData(): void {
    this.clear();
  }

  isAppointmentDataComplete(): boolean {
    const data = this.appointmentData;
    return !!(
      data?.professionalId &&
      data.professionalId > 0 &&
      data?.serviceIds?.length &&
      data?.date &&
      data?.time
    );
  }
}
