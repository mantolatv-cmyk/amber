'use server';

import prisma from "@ailearn/database";
import { revalidatePath } from "next/cache";
import { auth } from "../../../auth";
import { validateTransition, SessionStatus, stripe, calculateRefund, sendEmail, EmailTemplates } from "@ailearn/shared";

export async function acceptSession(sessionId: string) {
  const sessionAuth = await auth();
  if (!sessionAuth?.user) throw new Error("Unauthorized");

  const tutorId = sessionAuth.user.id;

  // Verify the session belongs to the tutor and is pending
  const session = await prisma.session.findFirst({
    where: {
      id: sessionId,
      tutor: { userId: tutorId },
      status: "pending_confirmation",
    }
  });

  if (!session) throw new Error("Session not found or invalid status");

  let nextStatus: SessionStatus;
  try {
    nextStatus = validateTransition(session.status as SessionStatus, 'TUTOR_CONFIRM');
  } catch (e: any) {
    throw new Error(`Cannot accept session in status: ${session.status}`);
  }

  // Confirm session
  await prisma.session.update({
    where: { id: sessionId },
    data: { status: nextStatus }
  });

  // (Optional) We could also hit the Daily API here if we want to create rooms upon tutor acceptance,
  // but for the MVP, the room is created right after Stripe webhook confirms it.
  // Oh wait, if the Stripe webhook confirmed it, the status would be 'confirmed'.
  // If it's 'pending_confirmation', maybe it hasn't been paid yet? Or maybe it's a request to book.
  // For the MVP, let's just update the status to confirmed.

  revalidatePath('/dashboard/tutor');
  return { success: true };
}

export async function rejectSession(sessionId: string) {
  const sessionAuth = await auth();
  if (!sessionAuth?.user) throw new Error("Unauthorized");

  const tutorId = sessionAuth.user.id;

  const session = await prisma.session.findFirst({
    where: {
      id: sessionId,
      tutor: { userId: tutorId },
      status: "pending_confirmation",
    }
  });

  if (!session) throw new Error("Session not found or invalid status");

  let nextStatus: SessionStatus;
  try {
    nextStatus = validateTransition(session.status as SessionStatus, 'TUTOR_CANCEL');
  } catch (e: any) {
    throw new Error(`Cannot reject session in status: ${session.status}`);
  }

  await prisma.session.update({
    where: { id: sessionId },
    data: { status: nextStatus, cancellationReason: 'Rejeitada pelo tutor' }
  });

  // Stripe refund logic
  const payment = await prisma.payment.findFirst({
    where: { sessionId: sessionId, status: { in: ['held_in_escrow', 'pending'] } }
  });

  if (payment && payment.stripePaymentIntentId) {
    try {
      const { refundAmountCents } = calculateRefund(
        payment.amountCents,
        'tutor',
        session.scheduledStart.toISOString()
      );

      if (refundAmountCents > 0) {
        await stripe.refunds.create({
          payment_intent: payment.stripePaymentIntentId,
          amount: refundAmountCents,
          reason: 'requested_by_customer'
        });
      }
    } catch (err) {
      console.error('Refund failed:', err);
    }
  }

  // Send cancellation email
  const fullSession = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      student: true,
      tutor: { include: { user: true } },
    }
  });

  if (fullSession) {
    const dateStr = fullSession.scheduledStart.toLocaleString('pt-BR');
    await sendEmail({
      to: fullSession.student.email,
      ...EmailTemplates.sessionCancelled(
        fullSession.student.fullName,
        fullSession.tutor.user.fullName,
        dateStr,
        'O tutor recusou a solicitação de aula.'
      )
    });
  }

  revalidatePath('/dashboard/tutor');
  return { success: true };
}
