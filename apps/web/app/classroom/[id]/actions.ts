'use server';

import prisma from "@ailearn/database";
import { auth } from "../../../auth";

export async function fetchClassroomData(sessionId: string) {
  const sessionAuth = await auth();
  if (!sessionAuth?.user?.id) throw new Error("Unauthorized");

  const userId = sessionAuth.user.id;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      subject: true,
      student: { select: { fullName: true } },
      tutor: { include: { user: { select: { fullName: true } } } },
    }
  });

  if (!session) throw new Error("Session not found");
  if (session.studentId !== userId && session.tutor.userId !== userId) {
    throw new Error("Forbidden");
  }

  // Ensure conversation exists or find it
  let conversationId = `session-${sessionId}`;

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
      otherUserId: session.studentId === userId ? session.tutor.userId : session.studentId,
      otherPersonName: session.studentId === userId ? session.tutor.user.fullName : session.student.fullName,
    }
  };
}

export async function saveSessionNotes(sessionId: string, notes: string) {
  const sessionAuth = await auth();
  if (!sessionAuth?.user?.id) throw new Error("Unauthorized");
  
  await prisma.session.update({
    where: { id: sessionId },
    data: { notes }
  });

  return { success: true };
}
