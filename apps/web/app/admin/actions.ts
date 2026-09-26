'use server';

import prisma from "@ailearn/database";
import { auth } from "../../auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "../../lib/notifications";
import { stripe, calculateSplit } from "@ailearn/shared";

async function verifyAdmin() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== 'admin') {
    throw new Error("Acesso não autorizado. Apenas administradores podem executar esta ação.");
  }
  return session.user;
}

export async function approveTutorAction(tutorId: string) {
  await verifyAdmin();

  const tutor = await prisma.tutorProfile.findUnique({
    where: { id: tutorId },
    include: { user: true },
  });

  if (!tutor) return { error: "Tutor não encontrado." };

  await prisma.tutorProfile.update({
    where: { id: tutorId },
    data: { status: 'approved' },
  });

  await createNotification({
    userId: tutor.userId,
    type: 'system',
    title: 'Perfil Aprovado! 🎉',
    body: 'Parabéns! Seu perfil de tutor foi revisado e aprovado. Agora você já aparece nas buscas da plataforma e pode receber agendamentos.',
  });

  revalidatePath('/admin');
  revalidatePath('/admin/tutors');
  revalidatePath('/search');
  revalidatePath(`/tutor/${tutorId}`);

  return { success: true };
}

export async function rejectTutorAction(tutorId: string, reason?: string) {
  await verifyAdmin();

  const tutor = await prisma.tutorProfile.findUnique({
    where: { id: tutorId },
  });

  if (!tutor) return { error: "Tutor não encontrado." };

  await prisma.tutorProfile.update({
    where: { id: tutorId },
    data: { status: 'rejected' },
  });

  await createNotification({
    userId: tutor.userId,
    type: 'system',
    title: 'Cadastro de Tutor não Aprovado',
    body: reason || 'Seu perfil de tutor não atendeu a todos os critérios de moderação da plataforma neste momento.',
  });

  revalidatePath('/admin');
  revalidatePath('/admin/tutors');
  return { success: true };
}

export async function suspendTutorAction(tutorId: string) {
  await verifyAdmin();

  const tutor = await prisma.tutorProfile.findUnique({
    where: { id: tutorId },
  });

  if (!tutor) return { error: "Tutor não encontrado." };

  await prisma.tutorProfile.update({
    where: { id: tutorId },
    data: { status: 'suspended' },
  });

  await createNotification({
    userId: tutor.userId,
    type: 'system',
    title: 'Conta Suspensa Temporariamente',
    body: 'Seu perfil de tutor foi suspenso pela moderação. Entre em contato com o suporte para mais informações.',
  });

  revalidatePath('/admin');
  revalidatePath('/admin/tutors');
  return { success: true };
}

export async function resolveDisputeAction(sessionId: string, resolution: 'tutor' | 'student') {
  await verifyAdmin();

  const dbSession = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      tutor: { include: { user: true } },
      student: true,
      payment: true,
    },
  });

  if (!dbSession) return { error: "Aula não encontrada." };
  const payment = dbSession.payment;

  if (resolution === 'tutor') {
    // Release escrow to tutor
    if (payment && tutorHasStripe(dbSession.tutor.stripeAccountId)) {
      const { tutorPayoutCents, platformFeeCents } = calculateSplit(
        payment.amountCents,
        dbSession.tutor.totalSessions || 0
      );

      try {
        await stripe.transfers.create({
          amount: tutorPayoutCents,
          currency: payment.currency.toLowerCase(),
          destination: dbSession.tutor.stripeAccountId!,
          transfer_group: `session_${sessionId}`,
        });

        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'released_to_tutor',
            releasedAt: new Date(),
            tutorPayoutCents,
            platformFeeCents,
          },
        });
      } catch (err) {
        console.error("Stripe transfer failed in dispute resolution:", err);
      }
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: { status: 'completed' },
    });

    await Promise.all([
      createNotification({
        userId: dbSession.tutor.userId,
        type: 'system',
        title: 'Disputa Resolvida a seu Favor',
        body: 'A moderação analisou o caso da aula e liberou o pagamento para sua conta.',
        data: { sessionId },
      }),
      createNotification({
        userId: dbSession.studentId,
        type: 'system',
        title: 'Disputa de Aula Encerrada',
        body: 'A moderação concluiu a análise da aula e manteve a remuneração do tutor.',
        data: { sessionId },
      })
    ]);

  } else {
    // Refund to student
    if (payment && payment.stripePaymentIntentId) {
      try {
        await stripe.refunds.create({
          payment_intent: payment.stripePaymentIntentId,
          reason: 'requested_by_customer',
        });

        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'refunded',
            refundedAt: new Date(),
          },
        });
      } catch (err) {
        console.error("Stripe refund failed in dispute resolution:", err);
      }
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: { status: 'cancelled_by_student', cancellationReason: 'Disputa resolvida com reembolso' },
    });

    await Promise.all([
      createNotification({
        userId: dbSession.studentId,
        type: 'system',
        title: 'Reembolso Aprovado pela Moderação',
        body: 'A moderação analisou sua contestação e o reembolso integral foi processado.',
        data: { sessionId },
      }),
      createNotification({
        userId: dbSession.tutor.userId,
        type: 'system',
        title: 'Disputa Encerrada com Reembolso ao Aluno',
        body: 'A moderação decidiu pelo reembolso da sessão.',
        data: { sessionId },
      })
    ]);
  }

  revalidatePath('/admin');
  revalidatePath('/admin/sessions');
  return { success: true };
}

function tutorHasStripe(stripeAccountId: string | null | undefined): boolean {
  return Boolean(stripeAccountId && stripeAccountId.startsWith('acct_'));
}
