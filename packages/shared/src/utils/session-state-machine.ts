/**
 * Session State Machine
 *
 * Enforces valid state transitions for the session lifecycle.
 * All transitions must go through this module.
 */

import type { SessionStatus, SessionEvent } from '../types/index.js';

const TRANSITIONS: Record<SessionStatus, Partial<Record<SessionEvent, SessionStatus>>> = {
  pending_confirmation: {
    TUTOR_CONFIRM: 'confirmed',
    STUDENT_CANCEL: 'cancelled_by_student',
    TUTOR_CANCEL: 'cancelled_by_tutor',
  },
  confirmed: {
    PARTICIPANT_JOINED: 'in_progress',
    STUDENT_CANCEL: 'cancelled_by_student',
    TUTOR_CANCEL: 'cancelled_by_tutor',
    NO_SHOW_DETECTED: 'no_show',
  },
  in_progress: {
    SESSION_ENDED: 'completed',
    DISPUTE_OPENED: 'disputed',
  },
  completed: {},
  cancelled_by_student: {},
  cancelled_by_tutor: {},
  no_show: {},
  disputed: {
    DISPUTE_RESOLVED_TUTOR: 'completed',
    DISPUTE_RESOLVED_STUDENT: 'cancelled_by_student',
  },
};

/**
 * Validates a state transition and returns the next status.
 * Throws if the transition is invalid.
 */
export function validateTransition(
  currentStatus: SessionStatus,
  event: SessionEvent,
): SessionStatus {
  const nextStatus = TRANSITIONS[currentStatus]?.[event];
  if (!nextStatus) {
    throw new Error(
      `Invalid state transition: cannot apply event '${event}' to session in status '${currentStatus}'`,
    );
  }
  return nextStatus;
}

/**
 * Returns all valid events for a given session status.
 */
export function getValidEvents(status: SessionStatus): SessionEvent[] {
  return Object.keys(TRANSITIONS[status] || {}) as SessionEvent[];
}

/**
 * Check if a session is in a terminal state (no further transitions possible).
 */
export function isTerminalState(status: SessionStatus): boolean {
  return getValidEvents(status).length === 0;
}

/**
 * Check if a specific transition is valid without throwing.
 */
export function canTransition(
  currentStatus: SessionStatus,
  event: SessionEvent,
): boolean {
  return TRANSITIONS[currentStatus]?.[event] !== undefined;
}
