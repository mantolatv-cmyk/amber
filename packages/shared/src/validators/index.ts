import { z } from 'zod';

// ============================================================
// Tutor Search Validators
// ============================================================

export const TutorSearchSchema = z.object({
  subject: z.string().max(100).optional(),
  priceMin: z.coerce.number().int().positive().optional(),
  priceMax: z.coerce.number().int().positive().optional(),
  ratingMin: z.coerce.number().min(1).max(5).optional(),
  availabilityDay: z.coerce.number().int().min(0).max(6).optional(),
  availabilityStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  availabilityEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  timezone: z.string().max(64).optional(),
  sortBy: z.enum(['rating', 'price_asc', 'price_desc', 'sessions']).optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().max(200).optional(),
});

export type TutorSearchInput = z.infer<typeof TutorSearchSchema>;

// ============================================================
// Booking Validators
// ============================================================

export const CreateBookingSchema = z.object({
  tutorId: z.string().uuid(),
  subjectId: z.string().uuid(),
  scheduledStart: z.string().datetime({ offset: true }),
  durationMinutes: z.number().int().min(30).max(120),
  isTrial: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
  idempotencyKey: z.string().min(10).max(255),
});



// ============================================================
// Session Action Validators
// ============================================================

export const SessionIdSchema = z.object({
  sessionId: z.string().uuid(),
});

export const CancelSessionSchema = z.object({
  sessionId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

// ============================================================
// Review Validators
// ============================================================

export const CreateReviewSchema = z.object({
  sessionId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  isPublic: z.boolean().default(true),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;

// ============================================================
// Auth Validators
// ============================================================

export const RegisterSchema = z.object({
  email: z.string().email().max(255),
  fullName: z.string().min(2).max(255),
  role: z.enum(['student', 'tutor']),
  timezone: z.string().max(64).default('UTC'),
  locale: z.string().max(10).default('pt-BR'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

// ============================================================
// Tutor Profile Validators
// ============================================================

export const UpdateTutorProfileSchema = z.object({
  headline: z.string().min(10).max(200).optional(),
  bio: z.string().min(50).max(5000).optional(),
  videoIntroUrl: z.string().url().optional(),
  hourlyRateCents: z.number().int().positive().optional(),
  trialRateCents: z.number().int().min(0).optional(),
  yearsExperience: z.number().int().min(0).optional(),
  subjectIds: z.array(z.string().uuid()).min(1).max(10).optional(),
});

export type UpdateTutorProfileInput = z.infer<typeof UpdateTutorProfileSchema>;
