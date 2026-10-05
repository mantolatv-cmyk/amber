'use server';

import prisma from "@ailearn/database";
import { isDatabaseReachable } from "../../../lib/db-check";
import { auth } from "../../../auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "../../../lib/notifications";

export async function fetchClassroomData(sessionId: string) {
  const sessionAuth = await auth();
  if (!sessionAuth?.user?.id) throw new Error("Unauthorized");

  const userId = sessionAuth.user.id;
  const isStudent = (sessionAuth?.user as any)?.role !== 'tutor';
  const dbOnline = await isDatabaseReachable();

  if (!dbOnline || sessionId.startsWith('demo-')) {
    return {
      success: true,
      data: {
        id: sessionId,
        subjectName: 'LangChain & RAG Avançado',
        dailyRoomUrl: null,
        scheduledStart: new Date().toISOString(),
        scheduledEnd: new Date(Date.now() + 3600000).toISOString(),
        status: 'confirmed',
        notes: '# Notas da Aula\n\n- [x] Apresentação e alinhamento de objetivos\n- [ ] Configuração do ambiente LangChain\n- [ ] Teste de embedding com pgvector\n- [ ] Otimização de chunking',
        tutorName: isStudent ? 'Marina Costa' : (sessionAuth.user.name || 'Tutor'),
        studentName: isStudent ? (sessionAuth.user.name || 'Aluno') : 'Lucas Dev',
        conversationId: `session-${sessionId}`,
        currentUserId: userId,
        isStudent,
        hasReviewed: false,
        review: null,
        otherUserId: isStudent ? 'tutor-id' : 'student-id',
        otherPersonName: isStudent ? 'Marina Costa' : 'Lucas Dev',
      }
    };
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      subject: true,
      student: { select: { fullName: true } },
      tutor: { include: { user: { select: { fullName: true } } } },
      review: { select: { id: true, rating: true, comment: true } },
    }
  });

  if (!session) throw new Error("Session not found");
  if (session.studentId !== userId && session.tutor.userId !== userId) {
    throw new Error("Forbidden");
  }

  const userIsStudent = session.studentId === userId;
  const conversationId = `session-${sessionId}`;

  return {
    success: true,
    data: {
      id: session.id,
      subjectName: session.subject.name,
      dailyRoomUrl: session.dailyRoomUrl,
      scheduledStart: session.scheduledStart.toISOString(),
      scheduledEnd: session.scheduledEnd.toISOString(),
      status: session.status,
      notes: session.notes || '',
      tutorName: session.tutor.user.fullName,
      studentName: session.student.fullName,
      conversationId,
      currentUserId: userId,
      isStudent: userIsStudent,
      hasReviewed: !!session.review,
      review: session.review,
      otherUserId: userIsStudent ? session.tutor.userId : session.studentId,
      otherPersonName: userIsStudent ? session.tutor.user.fullName : session.student.fullName,
    }
  };
}

export async function saveSessionNotes(sessionId: string, notes: string) {
  const sessionAuth = await auth();
  if (!sessionAuth?.user?.id) throw new Error("Unauthorized");
  
  const dbOnline = await isDatabaseReachable();
  if (!dbOnline || sessionId.startsWith('demo-')) {
    return { success: true };
  }

  try {
    await prisma.session.update({
      where: { id: sessionId },
      data: { notes }
    });
  } catch (err) {
    console.warn("Database error saving session notes:", err);
  }

  return { success: true };
}

export async function completeClassroomSession(sessionId: string) {
  const sessionAuth = await auth();
  if (!sessionAuth?.user?.id) throw new Error("Unauthorized");

  const userId = sessionAuth.user.id;
  const isStudent = (sessionAuth?.user as any)?.role !== 'tutor';
  const dbOnline = await isDatabaseReachable();

  if (!dbOnline || sessionId.startsWith('demo-')) {
    return { 
      success: true, 
      isStudent 
    };
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      tutor: { include: { user: true } },
      student: true,
    },
  });

  if (!session) throw new Error("Session not found");
  if (session.studentId !== userId && session.tutor.userId !== userId) {
    throw new Error("Forbidden");
  }

  // Only allow completing if not already completed or cancelled
  if (session.status === 'completed') {
    return { success: true, message: 'Session is already completed', isStudent: session.studentId === userId };
  }

  const now = new Date();
  const actualStart = session.actualStart || session.scheduledStart;

  // Update session
  await prisma.session.update({
    where: { id: sessionId },
    data: {
      status: 'completed',
      actualStart,
      actualEnd: now,
    },
  });

  // Calculate hours completed
  const durationHours = Math.max(1, Math.round(session.durationMinutes / 60));

  // Update Student stats
  try {
    await prisma.studentProfile.updateMany({
      where: { userId: session.studentId },
      data: {
        totalHoursLearned: { increment: durationHours },
      },
    });
  } catch (err) {
    console.error("Failed to update student profile stats:", err);
  }

  // Update Tutor stats
  try {
    await prisma.tutorProfile.update({
      where: { id: session.tutorId },
      data: {
        totalSessions: { increment: 1 },
      },
    });
  } catch (err) {
    console.error("Failed to update tutor stats:", err);
  }

  // Dispatch In-App Notifications
  await createNotification({
    userId: session.studentId,
    type: 'system',
    title: 'Aula Concluída!',
    body: `Sua aula com ${session.tutor.user.fullName} foi finalizada. Por favor, deixe sua avaliação.`,
    data: { sessionId },
  });

  await createNotification({
    userId: session.tutor.userId,
    type: 'system',
    title: 'Aula Finalizada com Sucesso',
    body: `Sua aula com ${session.student.fullName} foi finalizada. Os valores serão liberados de acordo com o cronograma de repasse.`,
    data: { sessionId },
  });

  revalidatePath(`/classroom/${sessionId}`);
  revalidatePath('/dashboard/student');
  revalidatePath('/dashboard/tutor');
  revalidatePath('/dashboard/sessions');

  return { 
    success: true, 
    isStudent: session.studentId === userId 
  };
}

export async function submitClassroomReview(sessionId: string, rating: number, comment?: string) {
  const sessionAuth = await auth();
  if (!sessionAuth?.user?.id) throw new Error("Unauthorized");

  const userId = sessionAuth.user.id;
  const dbOnline = await isDatabaseReachable();

  if (!dbOnline || sessionId.startsWith('demo-')) {
    return { 
      success: true, 
      data: { id: 'demo-review-id', rating, comment: comment || '' } 
    };
  }

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      tutor: { include: { user: true } },
      student: true,
    },
  });

  if (!session) throw new Error("Session not found");
  if (session.studentId !== userId) {
    throw new Error("Only the student can review this session");
  }

  // Check if review already exists
  const existingReview = await prisma.review.findUnique({
    where: { sessionId },
  });

  if (existingReview) {
    throw new Error("Esta aula já foi avaliada.");
  }

  const cleanRating = Math.max(1, Math.min(5, Math.round(rating)));

  // Create review
  await prisma.review.create({
    data: {
      sessionId,
      studentId: userId,
      tutorId: session.tutorId,
      rating: cleanRating,
      comment: comment?.trim() || null,
      isPublic: true,
    },
  });

  // Recalculate average rating for tutor
  const allReviews = await prisma.review.findMany({
    where: { tutorId: session.tutorId },
    select: { rating: true },
  });

  if (allReviews.length > 0) {
    const avg = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;
    await prisma.tutorProfile.update({
      where: { id: session.tutorId },
      data: {
        avgRating: Math.round(avg * 100) / 100,
      },
    });
  }

  // Notify tutor about new review
  await createNotification({
    userId: session.tutor.userId,
    type: 'review_received',
    title: 'Nova Avaliação Recebida!',
    body: `${session.student.fullName} avaliou a aula com nota ${cleanRating}★.`,
    data: { sessionId },
  });

  revalidatePath(`/classroom/${sessionId}`);
  revalidatePath(`/tutor/${session.tutorId}`);
  revalidatePath('/dashboard/student');
  revalidatePath('/dashboard/tutor');

  return { success: true };
}
