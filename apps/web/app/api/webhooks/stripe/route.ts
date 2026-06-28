import { NextRequest, NextResponse } from "next/server";
import prisma from "@ailearn/database";
import { stripe, sendEmail, EmailTemplates } from "@ailearn/shared";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Stripe Webhook Handler
 *
 * Handles: checkout.session.completed, charge.refunded
 * Creates Daily.co rooms upon successful payment.
 */
export async function POST(req: NextRequest) {
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature") || "";

  let event;

  try {
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    } else {
      console.warn("⚠️ STRIPE_WEBHOOK_SECRET is missing. Bypassing signature verification (dev only).");
      event = JSON.parse(payload);
    }
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const ourSessionId = session.client_reference_id;
        const paymentId = session.metadata?.paymentId;

        if (ourSessionId) {
          console.log(`✅ Payment successful for session ${ourSessionId}`);

          // 1. Mark Payment as held in escrow and session as confirmed
          await prisma.$transaction(async (tx: any) => {
            await tx.session.update({
              where: { id: ourSessionId },
              data: { status: "confirmed" },
            });

            if (paymentId) {
              await tx.payment.update({
                where: { id: paymentId },
                data: {
                  status: "held_in_escrow",
                  escrowHeldAt: new Date(),
                  stripePaymentIntentId: session.payment_intent,
                },
              });

              await tx.paymentEvent.create({
                data: {
                  paymentId: paymentId,
                  eventType: "checkout.session.completed",
                  previousStatus: "pending",
                  newStatus: "held_in_escrow",
                  stripeEventId: event.id,
                },
              });
            }
          });

          // 2. Create Daily.co Room for the session
          const DAILY_API_KEY = process.env.DAILY_CO_API_KEY;
          if (DAILY_API_KEY) {
            try {
              const roomRes = await fetch("https://api.daily.co/v1/rooms", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${DAILY_API_KEY}`,
                },
                body: JSON.stringify({
                  name: `session-${ourSessionId.substring(0, 8)}`,
                  privacy: "private",
                  properties: {
                    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
                    enable_chat: true,
                    start_audio_off: true,
                    start_video_off: false,
                    max_participants: 2,
                  },
                }),
              });

              if (roomRes.ok) {
                const roomData = await roomRes.json();
                await prisma.session.update({
                  where: { id: ourSessionId },
                  data: {
                    dailyRoomName: roomData.name,
                    dailyRoomUrl: roomData.url,
                  },
                });
                console.log(`🎥 Daily room created: ${roomData.url}`);
              } else {
                console.error("Failed to create Daily room:", await roomRes.text());
              }
            if (DAILY_API_KEY) {
              // ... room creation logic ...
            }
            
            // Re-fetch session with user emails
            const confirmedSession = await prisma.session.findUnique({
              where: { id: ourSessionId },
              include: {
                student: { include: { user: true } },
                tutor: { include: { user: true } },
              }
            });

            if (confirmedSession) {
              const studentName = confirmedSession.student.user.fullName;
              const tutorName = confirmedSession.tutor.user.fullName;
              const dateStr = confirmedSession.scheduledStart.toLocaleString("pt-BR");
              const joinUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/classroom/${ourSessionId}`;

              // Email to student
              await sendEmail({
                to: confirmedSession.student.user.email,
                ...EmailTemplates.sessionConfirmed(studentName, tutorName, dateStr, joinUrl)
              });

              // Email to tutor
              await sendEmail({
                to: confirmedSession.tutor.user.email,
                ...EmailTemplates.sessionConfirmed(tutorName, studentName, dateStr, joinUrl)
              });
            }

          } else {
            console.warn("⚠️ DAILY_CO_API_KEY is not set. Skipping room creation.");
          }
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as any;
        const paymentIntentId = charge.payment_intent;

        if (paymentIntentId) {
          const payment = await prisma.payment.findFirst({
            where: { stripePaymentIntentId: paymentIntentId },
          });

          if (payment) {
            const isFullRefund = charge.amount_refunded === charge.amount;
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: isFullRefund ? "refunded" : "partially_refunded",
                refundedAt: new Date(),
                stripeRefundId: charge.refunds?.data?.[0]?.id || null,
              },
            });

            await prisma.paymentEvent.create({
              data: {
                paymentId: payment.id,
                eventType: "charge.refunded",
                previousStatus: payment.status,
                newStatus: isFullRefund ? "refunded" : "partially_refunded",
                stripeEventId: event.id,
                metadata: {
                  amountRefunded: charge.amount_refunded,
                  totalAmount: charge.amount,
                },
              },
            });

            console.log(`💰 Refund processed for payment ${payment.id}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error("Error processing webhook event:", error);
    // Return 200 to avoid retries for processing errors
    // Stripe will retry on 5xx but not 2xx
  }

  return NextResponse.json({ received: true });
}
