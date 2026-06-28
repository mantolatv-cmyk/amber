import { NextRequest, NextResponse } from "next/server";
import prisma from "@ailearn/database";
import { stripe, calculateSplit } from "@ailearn/shared";

/**
 * Cron Job: Release Escrow Payments
 *
 * Runs periodically to find payments in `held_in_escrow` where the session
 * was completed more than `ESCROW_RELEASE_DELAY_HOURS` ago, and transfers
 * the tutor's cut to their connected Stripe account.
 */
export async function GET(req: NextRequest) {
  // Verify cron secret if configured to prevent unauthorized access
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const delayHours = 1; // From PAYMENT.ESCROW_RELEASE_DELAY_HOURS in @ailearn/shared
    const cutoffTime = new Date(Date.now() - delayHours * 60 * 60 * 1000);

    // Find payments ready for release
    const pendingReleases = await prisma.payment.findMany({
      where: {
        status: "held_in_escrow",
        session: {
          status: "completed",
          actualEnd: { lte: cutoffTime },
        },
      },
      include: {
        session: {
          include: {
            tutor: true,
          }
        },
      },
    });

    if (pendingReleases.length === 0) {
      return NextResponse.json({ success: true, message: "No payments to release", count: 0 });
    }

    let successCount = 0;
    let errorCount = 0;

    for (const payment of pendingReleases) {
      try {
        const tutor = payment.session?.tutor;
        if (!tutor?.stripeAccountId) {
          console.error(`Cannot release payment ${payment.id}: Tutor ${tutor?.id} has no connected Stripe account.`);
          errorCount++;
          continue;
        }

        // Calculate split based on tutor's total sessions
        // In a real app we might fetch the tutor's total completed sessions dynamically
        const { tutorPayoutCents } = calculateSplit(payment.amountCents, tutor.totalSessions || 0);

        // Perform the transfer
        const transfer = await stripe.transfers.create({
          amount: tutorPayoutCents,
          currency: payment.currency.toLowerCase(),
          destination: tutor.stripeAccountId,
          transfer_group: `session_${payment.sessionId}`,
          metadata: {
            paymentId: payment.id,
            sessionId: payment.sessionId,
          }
        });

        // Update DB
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: "released_to_tutor",
              releasedAt: new Date(),
              tutorPayoutCents: tutorPayoutCents,
              platformFeeCents: payment.amountCents - tutorPayoutCents,
            },
          });

          await tx.paymentEvent.create({
            data: {
              paymentId: payment.id,
              eventType: "escrow_released",
              previousStatus: "held_in_escrow",
              newStatus: "released_to_tutor",
              metadata: {
                transferId: transfer.id,
                tutorPayoutCents,
              }
            }
          });
        });

        successCount++;
        console.log(`✅ Escrow released for payment ${payment.id}. Transferred ${tutorPayoutCents} to ${tutor.stripeAccountId}`);

      } catch (err: any) {
        console.error(`Failed to release payment ${payment.id}:`, err);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Released ${successCount} payments. ${errorCount} errors.`,
      count: successCount,
    });
  } catch (error) {
    console.error("Escrow release cron error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
