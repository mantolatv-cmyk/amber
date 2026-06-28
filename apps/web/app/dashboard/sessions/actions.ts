'use server';

import prisma from "@ailearn/database";
import { auth } from "../../../auth";
import { revalidatePath } from "next/cache";
import { validateTransition, SessionStatus, SessionIdSchema, CancelSessionSchema, CreateReviewSchema, stripe, calculateRefund, sendEmail, EmailTemplates } from "@ailearn/shared";

export async function cancelSession(sessionId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  const dbSession = await prisma.session.findFirst({
    where: {
      id: sessionId,
      OR: [
        { studentId: userId },
        { tutor: { userId } },
      ],
      status: { in: ['confirmed', 'pending_confirmation'] },
    },
  });

  if (!dbSession) throw new Error("Session not found or cannot be cancelled");

  const isTutor = (session.user as any).role === 'tutor';
  const event = isTutor ? 'TUTOR_CANCEL' : 'STUDENT_CANCEL';

  // Validate state machine transition
  let nextStatus: SessionStatus;
  try {
    nextStatus = validateTransition(dbSession.status as SessionStatus, event);
  } catch (e: any) {
    throw new Error(`Cannot cancel session in status: ${dbSession.status}`);
  }

  await prisma.session.update({
    where: { id: sessionId },
    data: {
      status: nextStatus,
      cancellationReason: isTutor ? 'Cancelada pelo tutor' : 'Cancelada pelo aluno',
    },
  });

  // Stripe refund logic
  const payment = await prisma.payment.findFirst({
    where: { sessionId: sessionId, status: { in: ['held_in_escrow', 'pending'] } }
  });

  if (payment && payment.stripePaymentIntentId) {
    try {
      const { refundAmountCents } = calculateRefund(
        payment.amountCents,
        isTutor ? 'tutor' : 'student',
        dbSession.scheduledStart.toISOString()
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
      // Depending on requirements, we might want to throw here, but usually 
      // we want the session to cancel even if refund fails, and handle refund manually.
    }
  }
  
  // Send cancellation emails
  const fullSession = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      student: { include: { user: true } },
      tutor: { include: { user: true } },
    }
  });

  if (fullSession) {
    const dateStr = fullSession.scheduledStart.toLocaleString('pt-BR');
    if (isTutor) {
      // Tutor cancelled, email student
      await sendEmail({
        to: fullSession.student.user.email,
        ...EmailTemplates.sessionCancelled(
          fullSession.student.user.fullName,
          fullSession.tutor.user.fullName,
          dateStr,
          'Cancelada pelo tutor.'
        )
      });
    } else {
      // Student cancelled, email tutor
      await sendEmail({
        to: fullSession.tutor.user.email,
        ...EmailTemplates.sessionCancelled(
          fullSession.tutor.user.fullName,
          fullSession.student.user.fullName,
          dateStr,
          'Cancelada pelo aluno.'
        )
      });
    }
  }

  revalidatePath('/dashboard/sessions');
  return { success: true };
}

export async function submitReview(sessionId: string, rating: number, comment: string) {
  const parsed = CreateReviewSchema.safeParse({ sessionId, rating, comment, isPublic: true });
  if (!parsed.success) {
    throw new Error("Invalid review data");
  }

  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  // Verify session belongs to user and is completed
  const dbSession = await prisma.session.findFirst({
    where: {
      id: sessionId,
      studentId: userId,
      status: 'completed',
    },
  });

  if (!dbSession) throw new Error("Session not found or not eligible for review");

  // Check if review already exists
  const existing = await prisma.review.findUnique({
    where: { sessionId },
  });

  if (existing) throw new Error("Review already submitted");

  // Create review
  await prisma.review.create({
    data: {
      sessionId,
      studentId: userId,
      tutorId: dbSession.tutorId,
      rating,
      comment,
    },
  });

  // Update tutor's average rating
  const allReviews = await prisma.review.findMany({
    where: { tutorId: dbSession.tutorId },
    select: { rating: true },
  });

  const newAvg = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;

  await prisma.tutorProfile.update({
    where: { id: dbSession.tutorId },
    data: { avgRating: Math.round(newAvg * 100) / 100 },
  });

  revalidatePath('/dashboard/sessions');
  return { success: true };
}
