/**
 * Cancellation Policy
 *
 * Escalated refund policy based on how far in advance the cancellation is made:
 *   - > 24h before session: 100% refund
 *   - 4-24h before session: 50% refund
 *   - < 4h before session: 0% refund
 *   - Tutor cancels: always 100% refund
 */

export interface RefundCalculation {
  refundAmountCents: number;
  refundPercentage: number;
  reason: string;
}

/**
 * Calculate the refund amount based on the cancellation policy.
 *
 * @param priceCents - Total price of the session in cents
 * @param cancelledBy - Who is cancelling ('student' or 'tutor')
 * @param scheduledStartISO - ISO 8601 timestamp of scheduled start
 * @param nowISO - Current time as ISO 8601 (optional, defaults to now)
 */
export function calculateRefund(
  priceCents: number,
  cancelledBy: 'student' | 'tutor',
  scheduledStartISO: string,
  nowISO?: string,
): RefundCalculation {
  // Tutor cancels → always full refund
  if (cancelledBy === 'tutor') {
    return {
      refundAmountCents: priceCents,
      refundPercentage: 100,
      reason: 'Tutor cancelled — full refund guaranteed',
    };
  }

  const now = nowISO ? new Date(nowISO) : new Date();
  const scheduledStart = new Date(scheduledStartISO);
  const hoursUntilSession =
    (scheduledStart.getTime() - now.getTime()) / (1000 * 60 * 60);

  // Student cancellation policy - escalated
  if (hoursUntilSession > 24) {
    return {
      refundAmountCents: priceCents,
      refundPercentage: 100,
      reason: 'Cancelled more than 24 hours before session',
    };
  } else if (hoursUntilSession > 4) {
    return {
      refundAmountCents: Math.round(priceCents * 0.5),
      refundPercentage: 50,
      reason: 'Cancelled 4-24 hours before session — 50% refund',
    };
  } else {
    return {
      refundAmountCents: 0,
      refundPercentage: 0,
      reason: 'Cancelled less than 4 hours before session — no refund',
    };
  }
}
