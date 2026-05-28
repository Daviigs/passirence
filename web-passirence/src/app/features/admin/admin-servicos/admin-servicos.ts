import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminSidebarService } from '../admin-sidebar.service';
import { Servico, ServicosService } from './servicos.service';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-admin-servicos',
  imports: [FormsModule],
  templateUrl: './admin-servicos.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminServicos implements OnInit {
  private readonly servicosService = inject(ServicosService);
  private readonly sidebar = inject(AdminSidebarService);

  isLoading = signal(false);
  isSaving = signal(false);
  loadError = signal('');
  services = signal<Servico[]>([]);

  showModal = signal(false);
  editingService = signal<Servico | null>(null);
  showConfirmDelete = signal(false);
  pendingDelete = signal<Servico | null>(null);

  showToast = signal(false);
  toastMessage = signal('');
  toastType = signal<ToastType>('success');

  serviceName = '';
  serviceDuration = 30;
  servicePrice = 0;

  stats = computed(() => {
    const list = this.services();
    if (list.length === 0) {
      return { count: 0, avgPrice: 0, avgDuration: 0 };
    }
    const totalPrice = list.reduce((sum, s) => sum + s.preco, 0);
    const totalDuration = list.reduce((sum, s) => sum + s.duracao, 0);
    return {
      count: list.length,
      avgPrice: totalPrice / list.length,
      avgDuration: Math.round(totalDuration / list.length),
    };
  });

  ngOnInit(): void {
    this.loadServicos();
  }

  openMenu(): void {
    this.sidebar.open();
  }

  loadServicos(): void {
    this.isLoading.set(true);
    this.loadError.set('');
    this.servicosService.getServicos().subscribe({
      next: (data) => {
        this.services.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.loadError.set('Não foi possível carregar os serviços. Tente novamente.');
        this.isLoading.set(false);
      },
    });
  }

  openModal(service?: Servico): void {
    if (service) {
      this.editingService.set(service);
      this.serviceName = service.nome;
      this.serviceDuration = service.duracao;
      this.servicePrice = service.preco;
    } else {
      this.editingService.set(null);
      this.serviceName = '';
      this.serviceDuration = 30;
      this.servicePrice = 0;
    }
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingService.set(null);
  }

  saveService(): void {
    if (!this.serviceName.trim()) return;

    const payload = {
      nome: this.serviceName.trim(),
      duracao: this.serviceDuration,
      preco: this.servicePrice,
    };

    this.isSaving.set(true);
    const editing = this.editingService();

    const request = editing
      ? this.servicosService.updateServico(editing.id, payload)
      : this.servicosService.createServico(payload);

    request.subscribe({
      next: (saved) => {
        if (editing) {
          this.services.update((list) => list.map((s) => (s.id === saved.id ? saved : s)));
          this.showToastMessage('Serviço atualizado com sucesso.', 'success');
        } else {
          this.services.update((list) => [...list, saved]);
          this.showToastMessage('Serviço criado com sucesso.', 'success');
        }
        this.isSaving.set(false);
        this.closeModal();
      },
      error: () => {
        this.isSaving.set(false);
        this.showToastMessage(
          editing ? 'Erro ao atualizar serviço.' : 'Erro ao criar serviço.',
          'error',
        );
      },
    });
  }

  confirmDelete(service: Servico): void {
    this.pendingDelete.set(service);
    this.showConfirmDelete.set(true);
  }

  cancelDelete(): void {
    this.showConfirmDelete.set(false);
    this.pendingDelete.set(null);
  }

  executeDelete(): void {
    const service = this.pendingDelete();
    if (!service) return;

    this.servicosService.deleteServico(service.id).subscribe({
      next: () => {
        this.services.update((list) => list.filter((s) => s.id !== service.id));
        this.showToastMessage('Serviço removido com sucesso.', 'success');
        this.cancelDelete();
      },
      error: () => {
        this.showToastMessage('Erro ao excluir serviço.', 'error');
        this.cancelDelete();
      },
    });
  }

  dismissToast(): void {
    this.showToast.set(false);
  }

  formatPrice(price: number): string {
    return price.toFixed(2).replace('.', ',');
  }

  formatDuration(minutes: number): string {
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return m > 0 ? `${h}h ${m}min` : `${h}h`;
    }
    return `${minutes} min`;
  }

  serviceInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  private showToastMessage(message: string, type: ToastType): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 4000);
  }
}
