// ============================================================
// Session Status Types
// ============================================================

export type SessionStatus =
  | 'pending_confirmation'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled_by_student'
  | 'cancelled_by_tutor'
  | 'no_show'
  | 'disputed';

export type PaymentStatus =
  | 'pending'
  | 'held_in_escrow'
  | 'released_to_tutor'
  | 'refunded'
  | 'partially_refunded'
  | 'failed'
  | 'disputed';

export type UserRole = 'student' | 'tutor' | 'admin';
export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced';
export type TutorStatus = 'pending_review' | 'approved' | 'suspended' | 'rejected';

// ============================================================
// API Response Types
// ============================================================

export interface ApiResponse<T> {
  data: T;
  pagination?: PaginationMeta;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginationMeta {
  nextCursor: string | null;
  hasMore: boolean;
  totalEstimate?: number;
}

// ============================================================
// Tutor Search Types
// ============================================================

export interface TutorSearchFilters {
  subject?: string;
  priceMin?: number;
  priceMax?: number;
  ratingMin?: number;
  availabilityDay?: number;
  availabilityStart?: string;
  availabilityEnd?: string;
  timezone?: string;
  sortBy?: 'rating' | 'price_asc' | 'price_desc' | 'sessions';
  cursor?: string;
  limit?: number;
  q?: string;
}

export interface TutorSearchResult {
  id: string;
  user: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
  headline: string;
  bio: string;
  videoIntroUrl: string | null;
  hourlyRate: MoneyAmount;
  trialRate: MoneyAmount | null;
  subjects: SubjectInfo[];
  stats: TutorStats;
  nextAvailableSlot: string | null;
}

export interface MoneyAmount {
  amount: number;
  currency: string;
  formatted: string;
}

export interface SubjectInfo {
  slug: string;
  name: string;
  category?: string;
}

export interface TutorStats {
  avgRating: number;
  totalReviews: number;
  totalSessions: number;
  responseTimeMinutes: number | null;
}

// ============================================================
// Session / Booking Types
// ============================================================

export interface CreateBookingInput {
  tutorId: string;
  subjectId: string;
  scheduledStart: string;
  durationMinutes: number;
  isTrial: boolean;
  notes?: string;
  idempotencyKey: string;
}

export interface SessionDetail {
  id: string;
  status: SessionStatus;
  scheduledStart: string;
  scheduledEnd: string;
  durationMinutes: number;
  price: MoneyAmount;
  isTrial: boolean;
  tutor: {
    id: string;
    name: string;
    avatarUrl: string | null;
    headline: string;
  };
  subject: SubjectInfo;
  notes: string | null;
  dailyRoomUrl: string | null;
}

export interface ClassroomInfo {
  roomUrl: string;
  roomName: string;
  token: string;
  expiresAt: string;
}

// ============================================================
// Payment Types
// ============================================================

export interface PaymentDetail {
  id: string;
  status: PaymentStatus;
  amount: MoneyAmount;
  platformFee: MoneyAmount;
  tutorPayout: MoneyAmount;
  stripeClientSecret?: string;
  releasedAt: string | null;
}

// ============================================================
// Event Types for State Machine
// ============================================================

export type SessionEvent =
  | 'TUTOR_CONFIRM'
  | 'STUDENT_CANCEL'
  | 'TUTOR_CANCEL'
  | 'PARTICIPANT_JOINED'
  | 'SESSION_ENDED'
  | 'NO_SHOW_DETECTED'
  | 'DISPUTE_OPENED'
  | 'DISPUTE_RESOLVED_TUTOR'
  | 'DISPUTE_RESOLVED_STUDENT';
