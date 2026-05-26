import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ServicesApiService, AppointmentStateService } from '../../core/services';
import { Service } from '../../core/models';

@Component({
  selector: 'app-services',
  imports: [RouterLink],
  templateUrl: './services.html',
})
export class ServicesComponent implements OnInit {
  services: Service[] = [];
  selectedServices: Service[] = [];
  isLoading = signal(true);

  constructor(
    private readonly router: Router,
    private readonly servicesApi: ServicesApiService,
    private readonly appointmentState: AppointmentStateService,
  ) {}

  ngOnInit(): void {
    this.loadServices();
  }

  private loadServices(): void {
    this.isLoading.set(true);
    this.servicesApi.getServices().subscribe({
      next: (data) => {
        this.services = data;
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erro ao buscar serviços:', err);
        this.services = [];
        this.isLoading.set(false);
      },
    });
  }

  selectService(service: Service): void {
    const index = this.selectedServices.findIndex((s) => s.id === service.id);

    if (index > -1) {
      this.selectedServices.splice(index, 1);
    } else {
      this.selectedServices.push(service);
    }
  }

  isSelected(service: Service): boolean {
    return this.selectedServices.some((s) => s.id === service.id);
  }

  getTotalPrice(): number {
    return this.selectedServices.reduce((total, service) => total + service.price, 0);
  }

  getTotalDuration(): number {
    return this.selectedServices.reduce((total, service) => total + service.duration, 0);
  }

  continue(): void {
    if (this.selectedServices.length === 0) return;

    const serviceNames = this.selectedServices.map((s) => s.name).join(', ');
    const serviceIds = this.selectedServices.map((s) => s.id);

    this.appointmentState.setAppointmentData({
      professionalId: 0,
      professionalName: '',
      serviceIds,
      serviceName: serviceNames,
      date: '',
      time: '',
    });

    this.router.navigate(['/professionals']);
  }
}
