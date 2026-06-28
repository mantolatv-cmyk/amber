import { NextRequest, NextResponse } from "next/server";
import prisma from "@ailearn/database";
import { requireAuth, generateUnauthorizedResponse } from "../auth";
import { stripe } from "@ailearn/shared";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate User
    const auth = await requireAuth(req);
    if (!auth) {
      return generateUnauthorizedResponse();
    }

    // Only students can book sessions
    if (auth.role !== "student") {
      return NextResponse.json(
        { error: "Forbidden", message: "Only students can book sessions." },
        { status: 403 }
      );
    }

    // 2. Parse and validate payload
    const body = await req.json();

    const { z } = await import("zod");
    const BookingSchema = z.object({
      tutorId: z.string().uuid(),
      subjectId: z.string().uuid().optional(),
      scheduledStart: z.string().datetime({ offset: true }),
      scheduledEnd: z.string().datetime({ offset: true }),
      isTrial: z.boolean().default(false),
      notes: z.string().max(1000).optional(),
    });

    const parsed = BookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation Error", message: "Invalid request data.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { tutorId, subjectId, scheduledStart, scheduledEnd, isTrial, notes } = parsed.data;

    const start = new Date(scheduledStart);
    const end = new Date(scheduledEnd);
    const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);

    // 3. Verify Tutor exists and get pricing
    const tutor = await prisma.tutorProfile.findUnique({
      where: { id: tutorId },
    });

    if (!tutor) {
      return NextResponse.json(
        { error: "Not Found", message: "Tutor not found." },
        { status: 404 }
      );
    }

    // Auto-resolve subjectId if not provided
    let finalSubjectId = subjectId;
    if (!finalSubjectId) {
      const tutorSubject = await prisma.tutorSubject.findFirst({
        where: { tutorId: tutorId }
      });
      if (tutorSubject) {
        finalSubjectId = tutorSubject.subjectId;
      } else {
        return NextResponse.json(
          { error: "Bad Request", message: "Tutor has no subjects." },
          { status: 400 }
        );
      }
    }

    // 4. Calculate price
    const pricePerHourCents = isTrial && tutor.trialRateCents !== null 
      ? tutor.trialRateCents 
      : tutor.hourlyRateCents;
    
    const priceCents = Math.round(pricePerHourCents * (durationMinutes / 60));

    // 5. Create Session in Transaction (Optimistic Locking / Concurrency safe for booking)
    // In a real app we'd also check overlapping sessions here.
    
    // To check overlapping, we can just use a raw query with SELECT FOR UPDATE 
    // or just rely on a standard findFirst since we have isolated transactions.
    
    const result = await prisma.$transaction(async (tx: any) => {
      // Check for overlapping sessions for this tutor
      const overlapping = await tx.session.findFirst({
        where: {
          tutorId,
          status: {
            notIn: ["cancelled_by_student", "cancelled_by_tutor", "rejected"] as any,
          },
          OR: [
            {
              scheduledStart: { lt: end },
              scheduledEnd: { gt: start },
            }
          ]
        }
      });

      if (overlapping) {
        throw new Error("OVERLAPPING_SESSION");
      }

      // Create the session
      const session = await tx.session.create({
        data: {
          studentId: auth.userId, // Normally fetched from the user record based on auth
          tutorId,
          subjectId: finalSubjectId,
          scheduledStart: start,
          scheduledEnd: end,
          durationMinutes,
          priceCents,
          currency: tutor.currency,
          isTrial: !!isTrial,
          notes,
          status: "pending_confirmation",
        }
      });

      // Create the pending payment record
      // In a real flow, this would also generate a Stripe PaymentIntent with setup_future_usage
      // and manual capture. We mock it here.
      const payment = await tx.payment.create({
        data: {
          sessionId: session.id,
          studentId: auth.userId,
          tutorId: tutorId,
          amountCents: priceCents,
          currency: tutor.currency,
          status: "pending",
          idempotencyKey: `booking_${session.id}_${Date.now()}`,
        }
      });

      return { session, payment };
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // 6. Create Stripe Checkout Session
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: tutor.currency.toLowerCase(),
            product_data: {
              name: `Aula de IA com Tutor ${tutorId.substring(0, 8)}`,
              description: `Agendamento: ${start.toLocaleString("pt-BR")}`,
            },
            unit_amount: priceCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${appUrl}/dashboard/student?booking=success`,
      cancel_url: `${appUrl}/tutor/${tutorId}/book?booking=cancelled`,
      client_reference_id: result.session.id, // we pass our session ID to the webhook
      metadata: {
        paymentId: result.payment.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: result.session.id,
        checkoutUrl: stripeSession.url,
      }
    });

  } catch (error: any) {
    if (error.message === "OVERLAPPING_SESSION") {
      return NextResponse.json(
        { error: "Conflict", message: "The selected time slot is no longer available." },
        { status: 409 }
      );
    }
    
    console.error("Error in POST /v1/sessions:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
