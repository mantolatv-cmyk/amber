/**
 * Commission Tier Logic
 *
 * Determines the platform fee percentage based on the tutor's total sessions.
 * Follows a tiered model similar to Preply:
 *   - 0-50 sessions:   33% platform fee
 *   - 51-200 sessions:  25% platform fee
 *   - 201+ sessions:    18% platform fee
 */

export interface CommissionTier {
  minSessions: number;
  maxSessions: number | null;
  platformFeePct: number;
}

const DEFAULT_TIERS: CommissionTier[] = [
  { minSessions: 0, maxSessions: 50, platformFeePct: 33 },
  { minSessions: 51, maxSessions: 200, platformFeePct: 25 },
  { minSessions: 201, maxSessions: null, platformFeePct: 18 },
];

/**
 * Get the commission rate for a tutor based on their total completed sessions.
 */
export function getCommissionRate(
  totalSessions: number,
  tiers: CommissionTier[] = DEFAULT_TIERS,
): number {
  const tier = tiers.find(
    (t) =>
      totalSessions >= t.minSessions &&
      (t.maxSessions === null || totalSessions <= t.maxSessions),
  );
  return tier?.platformFeePct ?? DEFAULT_TIERS[0]!.platformFeePct;
}

/**
 * Calculate the split between platform fee and tutor payout.
 */
export function calculateSplit(
  totalAmountCents: number,
  totalSessions: number,
  tiers?: CommissionTier[],
): {
  platformFeeCents: number;
  tutorPayoutCents: number;
  commissionPct: number;
} {
  const commissionPct = getCommissionRate(totalSessions, tiers);
  const platformFeeCents = Math.round(totalAmountCents * (commissionPct / 100));
  const tutorPayoutCents = totalAmountCents - platformFeeCents;

  return {
    platformFeeCents,
    tutorPayoutCents,
    commissionPct,
  };
}
