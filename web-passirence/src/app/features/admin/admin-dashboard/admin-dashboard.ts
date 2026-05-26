import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DateUtils } from '../../../core/utils';
import { AdminSidebarService } from '../admin-sidebar.service';
import { DashboardService } from './dashboard.service';
import { DashboardHeader } from './components/header/dashboard-header';
import { DashboardStatsCard } from './components/stats-card/dashboard-stats-card';
import {
  DashboardAppointmentsList,
  UpcomingAppointmentItem,
} from './components/appointments-list/dashboard-appointments-list';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, DashboardHeader, DashboardStatsCard, DashboardAppointmentsList],
  templateUrl: './admin-dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly sidebar = inject(AdminSidebarService);
  private readonly router = inject(Router);

  readonly userName = signal('Davi');
  readonly dateLabel = signal(DateUtils.formatTodayHeader());
  readonly isLoading = signal(true);
  readonly loadError = signal('');

  readonly appointmentsToday = signal(0);
  readonly activeClientsToday = signal(0);
  readonly activeProfessionals = signal(0);
  readonly servicesPerformedToday = signal(0);
  readonly upcomingAppointments = signal<UpcomingAppointmentItem[]>([]);

  ngOnInit(): void {
    this.dashboardService.load().subscribe({
      next: (metrics) => {
        this.appointmentsToday.set(metrics.appointmentsToday);
        this.activeClientsToday.set(metrics.activeClientsToday);
        this.activeProfessionals.set(metrics.activeProfessionals);
        this.servicesPerformedToday.set(metrics.servicesPerformedToday);
        this.upcomingAppointments.set(metrics.upcoming);
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('Não foi possível carregar os dados da dashboard.');
        this.isLoading.set(false);
      },
    });
  }

  openMenu(): void {
    this.sidebar.open();
  }

  goToNewAppointment(): void {
    this.router.navigate(['/services']);
  }
}
