import { NextRequest, NextResponse } from "next/server";
import prisma from "@ailearn/database";

export async function POST(req: NextRequest) {
  try {
    const event = await req.json();

    // Daily.co webhook events (e.g. participant.joined, participant.left)
    if (event.type === "participant.joined") {
      const roomName = event.payload.room;
      
      // Find the session for this room
      const session = await prisma.session.findFirst({
        where: { dailyRoomName: roomName }
      });

      if (session && session.status === "confirmed") {
        await prisma.session.update({
          where: { id: session.id },
          data: {
            status: "in_progress",
            actualStart: session.actualStart || new Date()
          }
        });
      }
    } else if (event.type === "room.destroyed") {
       const roomName = event.payload.room;
       const session = await prisma.session.findFirst({
         where: { dailyRoomName: roomName }
       });

       if (session && session.status === "in_progress") {
         await prisma.session.update({
           where: { id: session.id },
           data: {
             status: "completed",
             actualEnd: new Date()
           }
         });
       }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Daily webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 400 });
  }
}
