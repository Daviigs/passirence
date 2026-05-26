import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BusinessHour, Settings, SettingsService } from './settings.service';

interface BusinessHourForm {
  weekday: number;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const TIMEZONE_OPTIONS = [
  'America/Sao_Paulo',
  'America/Manaus',
  'America/Fortaleza',
  'America/Recife',
  'America/Cuiaba',
  'America/Belem',
];

@Component({
  selector: 'app-admin-configuracoes',
  imports: [FormsModule],
  templateUrl: './admin-configuracoes.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminConfiguracoes implements OnInit {
  private readonly settingsService = inject(SettingsService);

  readonly weekdayLabels = WEEKDAY_LABELS;
  readonly timezoneOptions = TIMEZONE_OPTIONS;

  isLoading = signal(true);
  isSaving = signal(false);
  showFeedbackModal = signal(false);
  feedbackType = signal<'success' | 'error'>('success');
  feedbackMessage = signal('');

  timezone = signal('America/Sao_Paulo');
  slotInterval = signal(30);
  reminderMinutes = signal(60);
  businessHours = signal<BusinessHourForm[]>([]);

  ngOnInit(): void {
    this.loadSettings();
  }

  private loadSettings(): void {
    this.isLoading.set(true);
    this.settingsService.getSettings().subscribe({
      next: (data) => this.applySettings(data),
      error: () => {
        this.isLoading.set(false);
        this.feedbackType.set('error');
        this.feedbackMessage.set('Erro ao carregar configurações. Tente novamente.');
        this.showFeedbackModal.set(true);
      },
    });
  }

  private applySettings(data: Settings): void {
    this.timezone.set(data.timezone);
    this.slotInterval.set(data.slotInterval);
    this.reminderMinutes.set(data.reminderMinutes);
    this.businessHours.set(this.normalizeBusinessHours(data.businessHours));
    this.isLoading.set(false);
  }

  private normalizeBusinessHours(hours: BusinessHour[]): BusinessHourForm[] {
    const byWeekday = new Map<number, BusinessHourForm>();

    for (const weekday of [0, 1, 2, 3, 4, 5, 6]) {
      byWeekday.set(weekday, {
        weekday,
        isOpen: weekday >= 1 && weekday <= 5,
        openTime: '08:00',
        closeTime: '18:00',
      });
    }

    for (const hour of hours) {
      byWeekday.set(hour.weekday, {
        weekday: hour.weekday,
        isOpen: hour.isOpen,
        openTime: hour.openTime ?? '08:00',
        closeTime: hour.closeTime ?? '18:00',
      });
    }

    return Array.from(byWeekday.values()).sort((a, b) => a.weekday - b.weekday);
  }

  toggleDayOpen(weekday: number, isOpen: boolean): void {
    this.businessHours.update((days) =>
      days.map((d) =>
        d.weekday === weekday
          ? {
              ...d,
              isOpen,
              openTime: isOpen ? d.openTime || '08:00' : d.openTime,
              closeTime: isOpen ? d.closeTime || '18:00' : d.closeTime,
            }
          : d,
      ),
    );
  }

  updateDayTime(weekday: number, field: 'openTime' | 'closeTime', value: string): void {
    this.businessHours.update((days) =>
      days.map((d) => (d.weekday === weekday ? { ...d, [field]: value } : d)),
    );
  }

  saveSettings(): void {
    const validationError = this.validate();
    if (validationError) {
      this.feedbackType.set('error');
      this.feedbackMessage.set(validationError);
      this.showFeedbackModal.set(true);
      return;
    }

    this.isSaving.set(true);
    const payload = {
      timezone: this.timezone(),
      slotInterval: this.slotInterval(),
      reminderMinutes: this.reminderMinutes(),
      businessHours: this.buildBusinessHoursPayload(),
    };

    this.settingsService.updateSettings(payload).subscribe({
      next: (data) => {
        this.applySettings(data);
        this.isSaving.set(false);
        this.feedbackType.set('success');
        this.feedbackMessage.set('Configurações salvas com sucesso!');
        this.showFeedbackModal.set(true);
      },
      error: () => {
        this.isSaving.set(false);
        this.feedbackType.set('error');
        this.feedbackMessage.set('Erro ao salvar configurações. Verifique os dados e tente novamente.');
        this.showFeedbackModal.set(true);
      },
    });
  }

  private buildBusinessHoursPayload(): BusinessHour[] {
    return this.businessHours()
      .map((day) => {
        if (day.isOpen) {
          return {
            weekday: day.weekday,
            isOpen: true,
            openTime: day.openTime,
            closeTime: day.closeTime,
          };
        }
        return { weekday: day.weekday, isOpen: false };
      })
      .sort((a, b) => a.weekday - b.weekday);
  }

  private validate(): string | null {
    if (!this.timezone().trim()) {
      return 'O fuso horário é obrigatório.';
    }

    const interval = this.slotInterval();
    if (!interval || interval <= 0 || interval > 240) {
      return 'O intervalo de slots deve ser entre 1 e 240 minutos.';
    }

    if (this.reminderMinutes() < 0) {
      return 'O lembrete não pode ser negativo.';
    }

    const weekdays = this.businessHours().map((d) => d.weekday);
    if (weekdays.length !== 7 || new Set(weekdays).size !== 7) {
      return 'Configure todos os dias da semana (0 a 6) sem duplicatas.';
    }

    for (const day of this.businessHours()) {
      if (day.weekday < 0 || day.weekday > 6) {
        return 'Dia da semana inválido.';
      }

      if (!day.isOpen) continue;

      if (!this.isValidTime(day.openTime) || !this.isValidTime(day.closeTime)) {
        return `${WEEKDAY_LABELS[day.weekday]}: horários devem estar no formato HH:MM.`;
      }

      if (this.timeToMinutes(day.closeTime) <= this.timeToMinutes(day.openTime)) {
        return `${WEEKDAY_LABELS[day.weekday]}: o horário de fechamento deve ser posterior ao de abertura.`;
      }
    }

    return null;
  }

  private isValidTime(value: string): boolean {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  }

  private timeToMinutes(value: string): number {
    const [h, m] = value.split(':').map(Number);
    return h * 60 + m;
  }

  getReminderText(): string {
    const m = this.reminderMinutes();
    if (m === 0) return 'No momento do agendamento';
    if (m < 60) return `${m} minutos antes`;
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r > 0 ? `${h}h ${r}min antes` : `${h} hora${h > 1 ? 's' : ''} antes`;
  }

  getOpenDaysCount(): number {
    return this.businessHours().filter((d) => d.isOpen).length;
  }

  closeFeedbackModal(): void {
    this.showFeedbackModal.set(false);
  }
}
