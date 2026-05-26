import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Servico, ServicosService } from './servicos.service';

@Component({
  selector: 'app-admin-servicos',
  imports: [FormsModule],
  templateUrl: './admin-servicos.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminServicos implements OnInit {
  private readonly servicosService = inject(ServicosService);

  isLoading = signal(false);
  services = signal<Servico[]>([]);
  showModal = signal(false);
  editingService = signal<Servico | null>(null);
  showFeedbackModal = signal(false);
  feedbackType = signal<'success' | 'error' | 'confirm'>('success');
  feedbackMessage = signal('');

  serviceName = '';
  serviceDuration = 30;
  servicePrice = 0;

  private pendingDeleteId: number | null = null;

  ngOnInit(): void {
    this.isLoading.set(true);
    this.servicosService.getServicos().subscribe({
      next: (data) => {
        this.services.set(data);
        this.isLoading.set(false);
      },
      error: () => {
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

    if (this.editingService()) {
      this.servicosService.updateServico(this.editingService()!.id, payload).subscribe({
        next: (updated) => {
          this.services.update(list => list.map(s => s.id === updated.id ? updated : s));
          this.feedbackType.set('success');
          this.feedbackMessage.set('Serviço atualizado com sucesso!');
          this.showFeedbackModal.set(true);
          this.closeModal();
        },
        error: () => {
          this.feedbackType.set('error');
          this.feedbackMessage.set('Erro ao atualizar serviço. Tente novamente.');
          this.showFeedbackModal.set(true);
        },
      });
      return;
    }

    this.servicosService.createServico(payload).subscribe({
      next: (created) => {
        this.services.update(list => [...list, created]);
        this.feedbackType.set('success');
        this.feedbackMessage.set('Serviço criado com sucesso!');
        this.showFeedbackModal.set(true);
        this.closeModal();
      },
      error: () => {
        this.feedbackType.set('error');
        this.feedbackMessage.set('Erro ao criar serviço. Tente novamente.');
        this.showFeedbackModal.set(true);
      },
    });
  }

  deleteService(service: Servico): void {
    this.pendingDeleteId = service.id;
    this.feedbackType.set('confirm');
    this.feedbackMessage.set(`Deseja excluir o serviço "${service.nome}"?`);
    this.showFeedbackModal.set(true);
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
    return `${minutes}min`;
  }

  closeFeedbackModal(): void {
    this.showFeedbackModal.set(false);
    this.pendingDeleteId = null;
  }

  handleConfirmAction(): void {
    if (this.pendingDeleteId === null) return;
    const id = this.pendingDeleteId;
    this.servicosService.deleteServico(id).subscribe({
      next: () => {
        this.services.update(list => list.filter(s => s.id !== id));
        this.feedbackType.set('success');
        this.feedbackMessage.set('Serviço excluído com sucesso!');
        this.pendingDeleteId = null;
        this.showFeedbackModal.set(true);
      },
      error: () => {
        this.feedbackType.set('error');
        this.feedbackMessage.set('Erro ao excluir serviço. Tente novamente.');
        this.showFeedbackModal.set(true);
      },
    });
  }
}
