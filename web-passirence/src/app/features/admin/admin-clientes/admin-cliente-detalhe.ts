import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminSidebarService } from '../admin-sidebar.service';
import { ClienteService } from './cliente.service';
import { ClienteAppointmentService } from './cliente-appointment.service';
import { ClientesStoreService } from './clientes-store.service';
import {
  Cliente,
  ClienteAppointmentView,
  CreateClienteDTO,
} from './models/cliente.model';
import { ClienteDetails } from './components/cliente-details/cliente-details';
import { ClienteAppointments } from './components/cliente-appointments/cliente-appointments';
import { ClienteForm } from './components/cliente-form/cliente-form';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-admin-cliente-detalhe',
  imports: [ClienteDetails, ClienteAppointments, ClienteForm],
  templateUrl: './admin-cliente-detalhe.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminClienteDetalhe implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly clienteService = inject(ClienteService);
  private readonly appointmentService = inject(ClienteAppointmentService);
  private readonly store = inject(ClientesStoreService);
  private readonly sidebar = inject(AdminSidebarService);

  cliente = signal<Cliente | null>(null);
  appointments = signal<ClienteAppointmentView[]>([]);
  isLoadingCliente = signal(true);
  isLoadingAppointments = signal(true);
  loadError = signal('');

  showFormModal = signal(false);
  isSaving = signal(false);
  showToast = signal(false);
  toastMessage = signal('');
  toastType = signal<ToastType>('success');

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || id <= 0) {
      this.router.navigate(['/admin/clientes']);
      return;
    }
    this.resolveCliente(id);
    this.loadAppointments(id);
  }

  openMenu(): void {
    this.sidebar.open();
  }

  goBack(): void {
    this.router.navigate(['/admin/clientes']);
  }

  openEditModal(): void {
    this.showFormModal.set(true);
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
  }

  onSave(dto: CreateClienteDTO): void {
    const c = this.cliente();
    if (!c) return;

    this.isSaving.set(true);
    this.clienteService.update(c.id, dto).subscribe({
      next: (updated) => {
        this.cliente.set(updated);
        this.store.upsertClient(updated);
        this.isSaving.set(false);
        this.closeFormModal();
        this.showToastMessage('Cliente atualizado.', 'success');
      },
      error: (err: Error) => {
        this.isSaving.set(false);
        this.showToastMessage(err.message, 'error');
      },
    });
  }

  dismissToast(): void {
    this.showToast.set(false);
  }

  private resolveCliente(id: number): void {
    const cached = this.store.findById(id);
    if (cached) {
      this.cliente.set(cached);
      this.isLoadingCliente.set(false);
      return;
    }

    this.clienteService.listAll().subscribe({
      next: (list) => {
        this.store.setClients(list);
        const found = list.find((c) => c.id === id);
        if (found) {
          this.cliente.set(found);
          this.isLoadingCliente.set(false);
        } else {
          this.loadError.set('Cliente não encontrado.');
          this.isLoadingCliente.set(false);
        }
      },
      error: (err: Error) => {
        this.loadError.set(err.message);
        this.isLoadingCliente.set(false);
      },
    });
  }

  private loadAppointments(clientId: number): void {
    this.isLoadingAppointments.set(true);
    this.appointmentService.getHistoryByClientId(clientId).subscribe({
      next: (items) => {
        this.appointments.set(items);
        if (items.length > 0) {
          const last = items[0];
          const label = `${last.date.split('-').reverse().join('/')} ${last.startTime.slice(0, 5)}`;
          this.store.setLastAppointment(clientId, label);
        }
        this.isLoadingAppointments.set(false);
      },
      error: () => {
        this.isLoadingAppointments.set(false);
      },
    });
  }

  private showToastMessage(message: string, type: ToastType): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 4000);
  }
}
