import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProfissionaisService, Professional } from './profissionais.service';



@Component({
  selector: 'app-admin-profissionais',
  imports: [FormsModule],
  templateUrl: './admin-profissionais.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProfissionais implements OnInit {
  private readonly profissionaisService = inject(ProfissionaisService);

  isLoading = signal(false);
  professionals = signal<Professional[]>([]);
  showModal = signal(false);
  isEditing = signal(false);
  currentProfessional = signal<Professional | null>(null);
  showFeedbackModal = signal(false);
  feedbackType = signal<'success' | 'error' | 'confirm'>('success');
  feedbackMessage = signal('');

  formData = { nome: '', telefone: '' };
  phoneError = signal('');

  private pendingDeleteId: number | null = null;

  ngOnInit(): void {
    this.isLoading.set(true);
    this.profissionaisService.getProfessionals().subscribe({
      next: (data) => {
        this.professionals.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  openCreateModal(): void {
    this.isEditing.set(false);
    this.formData = { nome: '', telefone: '' };
    this.phoneError.set('');
    this.showModal.set(true);
  }

  openEditModal(professional: Professional): void {
    this.isEditing.set(true);
    this.currentProfessional.set(professional);
    this.formData = {
      nome: professional.nome,
      telefone: professional.telefone,
    };
    this.phoneError.set('');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.currentProfessional.set(null);
  }

  toggleProfessionalStatus(professional: Professional): void {
    const novoStatus = !professional.ativo;
    this.profissionaisService.toggleProfessionalStatus(professional.id, novoStatus).subscribe({
      next: () => {
        this.professionals.update(list =>
          list.map(p => p.id === professional.id ? { ...p, ativo: novoStatus } : p)
        );
        this.feedbackType.set('success');
        this.feedbackMessage.set(
          `Profissional ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`
        );
        this.showFeedbackModal.set(true);
      },
      error: () => {
        this.feedbackType.set('error');
        this.feedbackMessage.set('Erro ao alterar status do profissional. Tente novamente.');
        this.showFeedbackModal.set(true);
      },
    });
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 11);

    let formatted = digits;
    if (digits.length > 10) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    } else if (digits.length > 6) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    } else if (digits.length > 2) {
      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else if (digits.length > 0) {
      formatted = `(${digits}`;
    }

    this.formData.telefone = formatted;
    input.value = formatted;

    const valid = digits.length === 0 || digits.length === 10 || digits.length === 11;
    this.phoneError.set(valid ? '' : 'Telefone inválido. Use o formato (00) 00000-0000');
  }

  saveProfessional(): void {
    if (!this.formData.nome.trim()) return;

    const digits = this.formData.telefone.replace(/\D/g, '');
    if (digits.length !== 0 && digits.length !== 10 && digits.length !== 11) {
      this.phoneError.set('Telefone inválido. Use o formato (00) 00000-0000');
      return;
    }

    if (this.isEditing() && this.currentProfessional()) {
      this.profissionaisService.updateProfessional(this.currentProfessional()!.id, {
        nome: this.formData.nome.trim(),
        telefone: this.formData.telefone.trim(),
        ativo: this.currentProfessional()!.ativo,
      }).subscribe({
        next: (updated) => {
          this.professionals.update(list => list.map(p => p.id === updated.id ? updated : p));
          this.feedbackType.set('success');
          this.feedbackMessage.set('Profissional atualizado com sucesso!');
          this.showFeedbackModal.set(true);
          this.closeModal();
        },
        error: () => {
          this.feedbackType.set('error');
          this.feedbackMessage.set('Erro ao atualizar profissional. Tente novamente.');
          this.showFeedbackModal.set(true);
        },
      });
      return;
    }

    this.profissionaisService.createProfessional({
      nome: this.formData.nome.trim(),
      telefone: this.formData.telefone.trim(),
      ativo: true,
    }).subscribe({
      next: (created) => {
        this.professionals.update(list => [...list, created]);
        this.feedbackType.set('success');
        this.feedbackMessage.set('Profissional criado com sucesso!');
        this.showFeedbackModal.set(true);
        this.closeModal();
      },
      error: () => {
        this.feedbackType.set('error');
        this.feedbackMessage.set('Erro ao criar profissional. Tente novamente.');
        this.showFeedbackModal.set(true);
      },
    });
  }


  formatPhone(phone: string): string {
    return phone?.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') ?? '';
  }

  confirmDelete(professional: Professional): void {
    this.pendingDeleteId = professional.id;
    this.closeModal();
    this.feedbackType.set('confirm');
    this.feedbackMessage.set(`Tem certeza que deseja excluir "${professional.nome}"? Esta ação não pode ser desfeita.`);
    this.showFeedbackModal.set(true);
  }

  closeFeedbackModal(): void {
    this.showFeedbackModal.set(false);
    this.pendingDeleteId = null;
  }

  handleConfirmAction(): void {
    if (this.pendingDeleteId === null) return;
    const id = this.pendingDeleteId;
    this.profissionaisService.deleteProfessional(id).subscribe({
      next: () => {
        this.professionals.update(list => list.filter(p => p.id !== id));
        this.feedbackType.set('success');
        this.feedbackMessage.set('Profissional excluído com sucesso!');
        this.pendingDeleteId = null;
        this.showFeedbackModal.set(true);
      },
      error: () => {
        this.feedbackType.set('error');
        this.feedbackMessage.set('Erro ao excluir profissional. Tente novamente.');
        this.pendingDeleteId = null;
        this.showFeedbackModal.set(true);
      },
    });
  }
}
