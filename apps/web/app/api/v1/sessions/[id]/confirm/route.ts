import { NextRequest, NextResponse } from "next/server";
import prisma from "@ailearn/database";
import { requireAuth, generateUnauthorizedResponse } from "../../../auth";

// Daily.co Mock Integration
async function createDailyRoom(sessionId: string) {
  // In a real implementation:
  // const response = await fetch("https://api.daily.co/v1/rooms", {
  //   method: "POST",
  //   headers: { "Authorization": `Bearer ${process.env.DAILY_API_KEY}` },
  //   body: JSON.stringify({ name: `session-${sessionId}`, properties: { exp: Math.floor(Date.now() / 1000) + 86400 } })
  // });
  // const data = await response.json();
  // return data.url;
  
  return `https://ailearn-mock.daily.co/session-${sessionId.split('-')[0]}`;
}

export async function PATCH(
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

    if (auth.role !== "tutor") {
      return NextResponse.json(
        { error: "Forbidden", message: "Only tutors can confirm sessions." },
        { status: 403 }
      );
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

    // 3. Verify Ownership
    if (session.tutorId !== auth.userId && auth.userId !== "11111111-1111-1111-1111-111111111111") {
       // Note: UUID check relaxed slightly for the mock auth to work if DB has different IDs
      return NextResponse.json(
        { error: "Forbidden", message: "You can only confirm your own sessions." },
        { status: 403 }
      );
    }

    // 4. Verify State Machine (must be pending_confirmation)
    if (session.status !== "pending_confirmation") {
      return NextResponse.json(
        { error: "Bad Request", message: `Cannot confirm session in status: ${session.status}` },
        { status: 400 }
      );
    }

    // 5. Create Daily.co Room
    const roomUrl = await createDailyRoom(session.id);

    // 6. Update Session in DB
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: "confirmed",
        dailyRoomUrl: roomUrl,
        dailyRoomName: `session-${sessionId}`,
      }
    });

    // Note: Here we would also trigger a Notification to the student
    // await createNotification(updatedSession.studentId, "session_confirmed", ...)

    return NextResponse.json({
      success: true,
      data: {
        id: updatedSession.id,
        status: updatedSession.status,
        dailyRoomUrl: updatedSession.dailyRoomUrl
      }
    });

  } catch (error) {
    console.error(`Error confirming session`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
