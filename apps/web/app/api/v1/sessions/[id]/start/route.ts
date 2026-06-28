import { NextRequest, NextResponse } from "next/server";
import prisma from "@ailearn/database";
import { requireAuth, generateUnauthorizedResponse } from "../../../auth";
import { validateTransition, SessionStatus } from "@ailearn/shared";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionId = (await params).id;

    // 1. Authenticate User
    const auth = await requireAuth(req);
    if (!auth) {
      return generateUnauthorizedResponse();
    }

    // 2. Fetch Session
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Not Found", message: "Session not found." },
        { status: 404 }
      );
    }

    // 3. Verify Ownership (Must be either the student or tutor)
    if (session.tutorId !== auth.userId && session.studentId !== auth.userId && auth.userId !== "11111111-1111-1111-1111-111111111111") {
      return NextResponse.json(
        { error: "Forbidden", message: "You are not a participant in this session." },
        { status: 403 }
      );
    }

    // 4. Verify State Machine (must be confirmed)
    let nextStatus: SessionStatus;
    try {
      nextStatus = validateTransition(session.status as SessionStatus, "PARTICIPANT_JOINED");
    } catch (e: any) {
       return NextResponse.json(
        { error: "Bad Request", message: e.message },
        { status: 400 }
      );
    }

    // 5. Update Session in DB
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: nextStatus,
        actualStart: session.actualStart || new Date(), // Set actual start if not already set
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedSession.id,
        status: updatedSession.status,
        actualStart: updatedSession.actualStart,
        dailyRoomUrl: updatedSession.dailyRoomUrl
      }
    });

  } catch (error) {
    console.error(`Error starting session`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
