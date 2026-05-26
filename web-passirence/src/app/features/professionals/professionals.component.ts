import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProfessionalsApiService, AppointmentStateService } from '../../core/services';
import { Professional } from '../../core/models';

@Component({
  selector: 'app-professionals',
  imports: [RouterLink],
  templateUrl: './professionals.component.html',
})
export class ProfessionalsComponent implements OnInit {
  professionals: Professional[] = [];
  isLoading = signal(true);
  selectedProfessional: Professional | null = null;
  selectedServicesLabel = signal('');

  constructor(
    private readonly professionalsService: ProfessionalsApiService,
    private readonly appointmentState: AppointmentStateService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.validateServiceSelection();
    this.loadProfessionals();
  }

  private validateServiceSelection(): void {
    const appointmentData = this.appointmentState.getAppointmentData();
    if (!appointmentData?.serviceIds?.length) {
      this.router.navigate(['/services']);
      return;
    }
    this.selectedServicesLabel.set(appointmentData.serviceName);
  }

  private loadProfessionals(): void {
    this.isLoading.set(true);
    const appointmentData = this.appointmentState.getAppointmentData();
    const serviceIds = appointmentData?.serviceIds ?? [];

    this.professionalsService.getActive(serviceIds.length > 0 ? serviceIds : undefined).subscribe({
      next: (data) => {
        this.professionals = data;
        this.isLoading.set(false);

        if (this.professionals.length === 1) {
          this.autoSelectAndContinue(this.professionals[0]);
        }
      },
      error: (error) => {
        console.error('Erro ao carregar profissionais:', error);
        this.isLoading.set(false);
      },
    });
  }

  private autoSelectAndContinue(professional: Professional): void {
    const appointmentData = this.appointmentState.getAppointmentData();
    if (!appointmentData) {
      this.router.navigate(['/services']);
      return;
    }

    this.appointmentState.setAppointmentData({
      ...appointmentData,
      professionalId: professional.id,
      professionalName: professional.professionalName,
    });

    this.router.navigate(['/schedules']);
  }

  selectProfessional(professional: Professional): void {
    this.selectedProfessional =
      this.selectedProfessional?.id === professional.id ? null : professional;
  }

  isProfessionalSelected(professional: Professional): boolean {
    return this.selectedProfessional?.id === professional.id;
  }

  getInitial(professional: Professional): string {
    return professional.professionalName.charAt(0).toUpperCase();
  }

  continue(): void {
    if (!this.selectedProfessional) return;

    const appointmentData = this.appointmentState.getAppointmentData();
    if (!appointmentData) {
      this.router.navigate(['/services']);
      return;
    }

    this.appointmentState.setAppointmentData({
      ...appointmentData,
      professionalId: this.selectedProfessional.id,
      professionalName: this.selectedProfessional.professionalName,
    });

    this.router.navigate(['/schedules']);
  }

  formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 11) {
      return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    if (digits.length === 10) {
      return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  }
}
