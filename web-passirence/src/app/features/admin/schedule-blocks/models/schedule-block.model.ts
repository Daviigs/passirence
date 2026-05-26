export type ScheduleBlockType =
  | 'DAY_OFF'
  | 'CUSTOM_BLOCK'
  | 'LUNCH'
  | 'BREAK'
  | 'VACATION'
  | 'HOLIDAY';

export interface ScheduleBlock {
  id: number;
  professionalId?: number | null;
  type: ScheduleBlockType;
  isRecurring: boolean;
  weekDay?: number | null;
  date?: string | null;
  startTime: string;
  endTime: string;
  reason: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateScheduleBlockDTO {
  professionalId?: number | null;
  type: ScheduleBlockType;
  isRecurring: boolean;
  weekDay?: number | null;
  date?: string | null;
  startTime: string;
  endTime: string;
  reason: string;
}

export type UpdateScheduleBlockDTO = CreateScheduleBlockDTO;

export interface ScheduleBlockFilters {
  professionalId?: number | null;
  date?: string;
  isRecurring?: boolean;
  type?: ScheduleBlockType | '';
}

export const SCHEDULE_BLOCK_TYPE_OPTIONS: { value: ScheduleBlockType; label: string }[] = [
  { value: 'DAY_OFF', label: 'Folga' },
  { value: 'CUSTOM_BLOCK', label: 'Bloqueio personalizado' },
  { value: 'LUNCH', label: 'Almoço' },
  { value: 'BREAK', label: 'Pausa' },
  { value: 'VACATION', label: 'Férias' },
  { value: 'HOLIDAY', label: 'Feriado' },
];

export const WEEKDAY_OPTIONS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
] as const;
