import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { AdminSidebarService } from '../admin-sidebar.service';
import { ClienteService } from './cliente.service';
import { ClienteAppointmentService } from './cliente-appointment.service';
import { ClientesStoreService } from './clientes-store.service';
import {
  Cliente,
  ClienteStatusFilter,
  CreateClienteDTO,
} from './models/cliente.model';
import { matchesClienteSearch } from './cliente.utils';
import { ClienteSearch } from './components/cliente-search/cliente-search';
import { ClienteTable, ClienteTableRow } from './components/cliente-table/cliente-table';
import { ClienteCard } from './components/cliente-card/cliente-card';
import { ClienteForm } from './components/cliente-form/cliente-form';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-admin-clientes',
  imports: [ClienteSearch, ClienteTable, ClienteCard, ClienteForm],
  templateUrl: './admin-clientes.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminClientes implements OnInit {
  private readonly clienteService = inject(ClienteService);
  private readonly appointmentService = inject(ClienteAppointmentService);
  private readonly store = inject(ClientesStoreService);
  private readonly sidebar = inject(AdminSidebarService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchSubject = new Subject<string>();

  allClients = signal<Cliente[]>([]);
  searchInput = signal('');
  searchQuery = signal('');
  statusFilter = signal<ClienteStatusFilter>('all');
  isLoading = signal(true);
  loadError = signal('');

  showFormModal = signal(false);
  editingCliente = signal<Cliente | null>(null);
  isSaving = signal(false);
  showConfirmDelete = signal(false);
  pendingDelete = signal<Cliente | null>(null);

  showToast = signal(false);
  toastMessage = signal('');
  toastType = signal<ToastType>('success');

  filteredClients = computed(() => {
    const q = this.searchQuery();
    let list = this.allClients();

    const filter = this.statusFilter();
    if (filter === 'active') list = list.filter((c) => c.ativo);
    if (filter === 'inactive') list = list.filter((c) => !c.ativo);

    if (q.trim()) list = list.filter((c) => matchesClienteSearch(c, q));
    return list;
  });

  tableRows = computed<ClienteTableRow[]>(() =>
    this.filteredClients().map((c) => ({
      ...c,
      lastAppointmentLabel: this.store.getLastAppointment(c.id),
    })),
  );

  ngOnInit(): void {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((q) => this.searchQuery.set(q));

    this.loadClients();
  }

  openMenu(): void {
    this.sidebar.open();
  }

  onSearchChange(value: string): void {
    this.searchInput.set(value);
    this.searchSubject.next(value);
  }

  setStatusFilter(filter: ClienteStatusFilter): void {
    this.statusFilter.set(filter);
    this.loadClients();
  }

  openCreateModal(): void {
    this.editingCliente.set(null);
    this.showFormModal.set(true);
  }

  openEditModal(cliente: Cliente): void {
    this.editingCliente.set(cliente);
    this.showFormModal.set(true);
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
    this.editingCliente.set(null);
  }

  onSave(dto: CreateClienteDTO): void {
    const editing = this.editingCliente();
    this.isSaving.set(true);

    const request = editing
      ? this.clienteService.update(editing.id, dto)
      : this.clienteService.create(dto);

    request.subscribe({
      next: (saved) => {
        if (editing) {
          this.allClients.update((list) => list.map((c) => (c.id === saved.id ? saved : c)));
        } else {
          this.allClients.update((list) => [...list, saved]);
        }
        this.store.upsertClient(saved);
        this.isSaving.set(false);
        this.closeFormModal();
        this.showToastMessage(editing ? 'Cliente atualizado.' : 'Cliente cadastrado.', 'success');
      },
      error: (err: Error) => {
        this.isSaving.set(false);
        this.showToastMessage(err.message, 'error');
      },
    });
  }

  onToggle(cliente: Cliente): void {
    this.clienteService.toggleStatus(cliente.id).subscribe({
      next: () => {
        const updated = { ...cliente, ativo: !cliente.ativo };
        this.allClients.update((list) => list.map((c) => (c.id === updated.id ? updated : c)));
        this.store.upsertClient(updated);
        this.showToastMessage(
          updated.ativo ? 'Cliente ativado.' : 'Cliente desativado.',
          'success',
        );
      },
      error: (err: Error) => this.showToastMessage(err.message, 'error'),
    });
  }

  confirmDelete(cliente: Cliente): void {
    this.pendingDelete.set(cliente);
    this.showConfirmDelete.set(true);
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
    this.showConfirmDelete.set(false);
  }

  executeDelete(): void {
    const cliente = this.pendingDelete();
    if (!cliente) return;

    this.clienteService.delete(cliente.id).subscribe({
      next: () => {
        this.allClients.update((list) => list.filter((c) => c.id !== cliente.id));
        this.store.removeClient(cliente.id);
        this.showToastMessage('Cliente removido.', 'success');
        this.cancelDelete();
      },
      error: (err: Error) => {
        this.showToastMessage(err.message, 'error');
        this.cancelDelete();
      },
    });
  }

  loadClients(): void {
    this.isLoading.set(true);
    this.loadError.set('');

    const filter = this.statusFilter();
    const request =
      filter === 'active'
        ? this.clienteService.listActive()
        : this.clienteService.listAll();

    request.subscribe({
      next: (data) => {
        let list = data;
        if (filter === 'inactive') {
          list = data.filter((c) => !c.ativo);
        }
        this.allClients.set(list);
        this.store.setClients(list);
        this.isLoading.set(false);
        this.prefetchLastAppointments(list.slice(0, 20));
      },
      error: (err: Error) => {
        this.loadError.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  dismissToast(): void {
    this.showToast.set(false);
  }

  private prefetchLastAppointments(clients: Cliente[]): void {
    for (const c of clients) {
      if (this.store.getLastAppointment(c.id) !== '—') continue;
      this.appointmentService.getLastAppointmentLabel(c.id).subscribe({
        next: (label) => this.store.setLastAppointment(c.id, label),
      });
    }
  }

  private showToastMessage(message: string, type: ToastType): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 4000);
  }
}
