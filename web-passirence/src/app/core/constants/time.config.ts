export const TIME_CONFIG = {
  DAYS_TO_FETCH_AVAILABLE: 60,
  MAX_AVAILABLE_DATES: 30,
  DAYS_AHEAD_FOR_SCHEDULING: 14,
  DEFAULT_SLOT_INTERVAL: 30,
  DEFAULT_OPEN_TIME: '08:00',
  DEFAULT_CLOSE_TIME: '18:00',
  REDIRECT_DELAY: 2500,
  SUCCESS_MESSAGE_DURATION: 2000,
  ERROR_MESSAGE_DURATION: 3000,
} as const;

export const VALIDATION = {
  MIN_NAME_LENGTH: 3,
  MIN_PHONE_DIGITS: 10,
  MAX_PHONE_DIGITS: 11,
} as const;

export const DAY_NAMES_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

export const MONTH_NAMES_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
] as const;
