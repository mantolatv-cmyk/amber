import { NextRequest, NextResponse } from "next/server";
import prisma from "@ailearn/database";
import crypto from "crypto";
import { createNotification } from "../../../../lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const webhookSecret = process.env.DAILY_WEBHOOK_SECRET;

    // Signature verification if secret is configured
    if (webhookSecret) {
      const signature = req.headers.get("x-webhook-signature") || "";
      const expectedSig = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      if (signature !== expectedSig) {
        console.error("Daily webhook signature mismatch");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);

    // Daily.co webhook events
    if (event.type === "participant.joined") {
      const roomName = event.payload?.room;
      
      const session = await prisma.session.findFirst({
        where: { dailyRoomName: roomName },
        include: { tutor: true }
      });

      if (session && session.status === "confirmed") {
        await prisma.session.update({
          where: { id: session.id },
          data: {
            status: "in_progress",
            actualStart: session.actualStart || new Date()
          }
        });

        // Notify participants that class has started
        await Promise.all([
          createNotification({
            userId: session.studentId,
            type: 'session_started',
            title: 'Aula Iniciada!',
            body: 'A sala virtual está ativa e em andamento.',
            data: { sessionId: session.id }
          }),
          createNotification({
            userId: session.tutor.userId,
            type: 'session_started',
            title: 'Aula Iniciada!',
            body: 'A sessão está marcada como em andamento.',
            data: { sessionId: session.id }
          })
        ]);
      }
    } else if (event.type === "room.destroyed") {
       const roomName = event.payload?.room;
       const session = await prisma.session.findFirst({
         where: { dailyRoomName: roomName },
         include: { tutor: true }
       });

       if (session && session.status === "in_progress") {
         await prisma.session.update({
           where: { id: session.id },
           data: {
             status: "completed",
             actualEnd: new Date()
           }
         });

         // Increment tutor's completed sessions count
         await prisma.tutorProfile.update({
           where: { id: session.tutorId },
           data: { totalSessions: { increment: 1 } }
         });

         // Notify student to leave a review
         await createNotification({
           userId: session.studentId,
           type: 'review_received',
           title: 'Aula Concluída!',
           body: 'Como foi sua experiência? Deixe uma avaliação para o seu tutor no painel.',
           data: { sessionId: session.id }
         });
       }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Daily webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 400 });
  }
}
