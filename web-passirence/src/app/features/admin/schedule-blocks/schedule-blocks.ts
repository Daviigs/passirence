import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ProfissionaisService, Professional } from '../admin-profissionais/profissionais.service';
import { AdminSidebarService } from '../admin-sidebar.service';
import { ScheduleBlockService } from './schedule-block.service';
import {
  CreateScheduleBlockDTO,
  ScheduleBlock,
  ScheduleBlockFilters,
} from './models/schedule-block.model';
import { ScheduleBlockFiltersComponent } from './components/schedule-block-filters/schedule-block-filters';
import { ScheduleBlockTable, ScheduleBlockRow } from './components/schedule-block-table/schedule-block-table';
import { ScheduleBlockCard } from './components/schedule-block-card/schedule-block-card';
import { ScheduleBlockForm } from './components/schedule-block-form/schedule-block-form';

type ToastType = 'success' | 'error';

@Component({
  selector: 'app-schedule-blocks',
  imports: [
    ScheduleBlockFiltersComponent,
    ScheduleBlockTable,
    ScheduleBlockCard,
    ScheduleBlockForm,
  ],
  templateUrl: './schedule-blocks.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleBlocks implements OnInit {
  private readonly scheduleBlockService = inject(ScheduleBlockService);
  private readonly profissionaisService = inject(ProfissionaisService);
  private readonly sidebar = inject(AdminSidebarService);

  blocks = signal<ScheduleBlock[]>([]);
  professionals = signal<Professional[]>([]);
  filters = signal<ScheduleBlockFilters>({});
  isLoading = signal(true);
  isSaving = signal(false);
  loadError = signal('');

  showFormModal = signal(false);
  editingBlock = signal<ScheduleBlock | null>(null);
  showConfirmDelete = signal(false);
  pendingDelete = signal<ScheduleBlock | null>(null);

  toastMessage = signal('');
  toastType = signal<ToastType>('success');
  showToast = signal(false);

  rows = computed<ScheduleBlockRow[]>(() =>
    this.blocks().map((block) => ({
      ...block,
      professionalLabel: this.getProfessionalLabel(block.professionalId),
    })),
  );

  ngOnInit(): void {
    this.loadProfessionals();
    this.loadBlocks();
  }

  openMenu(): void {
    this.sidebar.open();
  }

  openCreateModal(): void {
    this.editingBlock.set(null);
    this.showFormModal.set(true);
  }

  openEditModal(block: ScheduleBlock): void {
    this.editingBlock.set(block);
    this.showFormModal.set(true);
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
    this.editingBlock.set(null);
  }

  onFiltersChange(filters: ScheduleBlockFilters): void {
    this.filters.set(filters);
    this.loadBlocks();
  }

  clearFilters(): void {
    this.filters.set({});
    this.loadBlocks();
  }

  confirmDelete(block: ScheduleBlock): void {
    this.pendingDelete.set(block);
    this.showConfirmDelete.set(true);
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
    this.showConfirmDelete.set(false);
  }

  executeDelete(): void {
    const block = this.pendingDelete();
    if (!block) return;

    this.scheduleBlockService.delete(block.id).subscribe({
      next: () => {
        this.blocks.update((list) => list.filter((b) => b.id !== block.id));
        this.showToastMessage('Bloqueio removido com sucesso.', 'success');
        this.cancelDelete();
      },
      error: (err: Error) => {
        this.showToastMessage(err.message || 'Erro ao remover bloqueio.', 'error');
        this.cancelDelete();
      },
    });
  }

  onSave(dto: CreateScheduleBlockDTO): void {
    const editing = this.editingBlock();
    this.isSaving.set(true);

    const request = editing
      ? this.scheduleBlockService.update(editing.id, dto)
      : this.scheduleBlockService.create(dto);

    request.subscribe({
      next: (saved) => {
        if (editing) {
          this.blocks.update((list) => list.map((b) => (b.id === saved.id ? saved : b)));
          this.showToastMessage('Bloqueio atualizado com sucesso.', 'success');
        } else {
          this.blocks.update((list) => [...list, saved]);
          this.showToastMessage('Bloqueio criado com sucesso.', 'success');
        }
        this.isSaving.set(false);
        this.closeFormModal();
        this.loadBlocks();
      },
      error: (err: Error) => {
        this.isSaving.set(false);
        this.showToastMessage(err.message || 'Erro ao salvar bloqueio.', 'error');
      },
    });
  }

  getProfessionalLabel(professionalId: number | null | undefined): string {
    if (professionalId == null) return 'Barbearia (global)';
    return this.professionals().find((p) => p.id === professionalId)?.nome ?? `Prof. #${professionalId}`;
  }

  dismissToast(): void {
    this.showToast.set(false);
  }

  private loadProfessionals(): void {
    this.profissionaisService.getProfessionals().subscribe({
      next: (data) => this.professionals.set(data),
      error: () => this.professionals.set([]),
    });
  }

  loadBlocks(): void {
    this.isLoading.set(true);
    this.loadError.set('');

    const filters = this.filters();
    this.scheduleBlockService.list(filters).subscribe({
      next: (data) => {
        let result = data;
        if (filters.professionalId === null) {
          result = result.filter((b) => b.professionalId == null);
        }
        this.blocks.set(result);
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        this.loadError.set(err.message || 'Erro ao carregar bloqueios.');
        this.isLoading.set(false);
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
