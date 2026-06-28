import { NextRequest, NextResponse } from "next/server";
import prisma from "@ailearn/database";
import { stripe } from "@ailearn/shared";
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const sig = req.headers.get("stripe-signature") || "";

  let event;

  try {
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    } else {
      console.warn("⚠️ STRIPE_WEBHOOK_SECRET is missing. Bypassing signature verification (only for dev).");
      event = JSON.parse(payload);
    }
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const ourSessionId = session.client_reference_id;
    const paymentId = session.metadata?.paymentId;

    if (ourSessionId) {
      console.log(`✅ Payment successful for session ${ourSessionId}`);

      try {
        // 1. Mark Payment and Session as confirmed
        await prisma.$transaction(async (tx) => {
          await tx.session.update({
            where: { id: ourSessionId },
            data: { status: "confirmed" },
          });

          if (paymentId) {
            await tx.payment.update({
              where: { id: paymentId },
              data: {
                status: "held_in_escrow",
                stripePaymentIntentId: session.payment_intent,
              },
            });
            
            await tx.paymentEvent.create({
              data: {
                paymentId: paymentId,
                eventType: "checkout.session.completed",
                newStatus: "held_in_escrow",
                stripeEventId: event.id,
              }
            });
          }
        });

        // 2. Create Daily.co Room for the session
        // We do this via an internal fetch or calling the helper directly.
        // For simplicity, we just make the fetch here:
        const DAILY_API_KEY = process.env.DAILY_CO_API_KEY;
        if (DAILY_API_KEY) {
          const roomRes = await fetch("https://api.daily.co/v1/rooms", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${DAILY_API_KEY}`,
            },
            body: JSON.stringify({
              name: `session-${ourSessionId}`,
              privacy: "private",
              properties: {
                exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // expires in 24h
                enable_chat: true,
                start_audio_off: true,
                start_video_off: false,
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
            console.error("Failed to create Daily room", await roomRes.text());
          }
        } else {
          console.warn("⚠️ DAILY_CO_API_KEY is not set. Skipping room creation.");
        }

      } catch (err) {
        console.error("Failed to update database after webhook:", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
