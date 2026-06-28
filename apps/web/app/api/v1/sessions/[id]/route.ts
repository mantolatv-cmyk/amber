import { NextRequest, NextResponse } from "next/server";
import prisma from "@ailearn/database";
import { requireAuth, generateUnauthorizedResponse } from "../../auth";

export async function GET(req: NextRequest, { params }: any) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return generateUnauthorizedResponse();

    const session = await prisma.session.findUnique({
      where: { id: params.id },
      include: {
        student: { select: { fullName: true } },
        tutor: { include: { user: { select: { fullName: true } } } },
        subject: true,
      }
    });

    if (!session) {
      return NextResponse.json({ error: "Not Found", message: "Session not found." }, { status: 404 });
    }

    // Ensure the user is either the student or the tutor of this session
    if (session.studentId !== auth.userId && session.tutor.userId !== auth.userId) {
      return NextResponse.json({ error: "Forbidden", message: "You are not part of this session." }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: session.id,
        status: session.status,
        dailyRoomUrl: session.dailyRoomUrl,
        scheduledStart: session.scheduledStart,
        scheduledEnd: session.scheduledEnd,
        subjectName: session.subject.name,
        tutorName: session.tutor.user.fullName,
        studentName: session.student.fullName,
      }
    });

  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
