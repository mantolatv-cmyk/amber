/**
 * Platform Constants
 */

// ============================================================
// Session Constraints
// ============================================================
export const SESSION = {
  MIN_DURATION_MINUTES: 30,
  MAX_DURATION_MINUTES: 120,
  DEFAULT_DURATION_MINUTES: 60,
  EARLY_JOIN_WINDOW_MINUTES: 5,
  NO_SHOW_TIMEOUT_MINUTES: 15,
  BUFFER_AFTER_SESSION_MINUTES: 15,
  AUTO_CANCEL_UNCONFIRMED_HOURS: 24,
} as const;

// ============================================================
// Payment Constraints
// ============================================================
export const PAYMENT = {
  DEFAULT_CURRENCY: 'BRL',
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAYS_MS: [1000, 3000, 9000] as readonly number[],
  ESCROW_RELEASE_DELAY_HOURS: 1,
} as const;

// ============================================================
// Platform Config
// ============================================================
export const PLATFORM = {
  NAME: 'OpenLearn',
  TAGLINE: 'Aprenda IA com especialistas. 1 a 1. Ao vivo.',
  DEFAULT_LOCALE: 'pt-BR',
  DEFAULT_TIMEZONE: 'America/Sao_Paulo',
  SUPPORTED_CURRENCIES: ['BRL', 'USD'] as readonly string[],
  MAX_SUBJECTS_PER_TUTOR: 10,
  MIN_HOURLY_RATE_CENTS: 2000,  // R$ 20.00
  MAX_HOURLY_RATE_CENTS: 100000, // R$ 1000.00
} as const;

// ============================================================
// API Config
// ============================================================
export const API = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 50,
  RATE_LIMIT_WINDOW_MS: 60_000,
  RATE_LIMIT_MAX_REQUESTS: 100,
} as const;

// ============================================================
// Subject Categories
// ============================================================
export const SUBJECT_CATEGORIES = [
  'Fundamentos de IA',
  'Engenharia de Prompts',
  'Desenvolvimento com IA',
  'Automação com IA',
  'Machine Learning',
  'IA Generativa',
  'Dados & Analytics',
  'IA para Negócios',
] as const;

export type SubjectCategory = (typeof SUBJECT_CATEGORIES)[number];
