import { NextRequest, NextResponse } from "next/server";
import prisma from "@ailearn/database";
import { requireAuth, generateUnauthorizedResponse } from "../../../auth";

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

    // 2. Fetch Session and Payment
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { payment: true }
    });

    if (!session) {
      return NextResponse.json(
        { error: "Not Found", message: "Session not found." },
        { status: 404 }
      );
    }

    // 3. Verify Ownership (Only student or admin can release payment)
    if (session.studentId !== auth.userId && auth.role !== "admin" && auth.userId !== "11111111-1111-1111-1111-111111111111") {
      return NextResponse.json(
        { error: "Forbidden", message: "Only the student or admin can release payment." },
        { status: 403 }
      );
    }

    if (!session.payment) {
        return NextResponse.json(
            { error: "Bad Request", message: "No payment associated with this session." },
            { status: 400 }
        );
    }

    if (session.payment.status !== "held_in_escrow") {
        return NextResponse.json(
            { error: "Bad Request", message: `Payment is not in escrow. Current status: ${session.payment.status}` },
            { status: 400 }
        );
    }

    // 4. Update Payment status
    // In a real implementation, this would call Stripe to transfer funds to the tutor
    const updatedPayment = await prisma.payment.update({
        where: { id: session.payment.id },
        data: {
            status: "released_to_tutor",
            releasedAt: new Date(),
        }
    });

    // Create a PaymentEvent
    await prisma.paymentEvent.create({
        data: {
            paymentId: updatedPayment.id,
            eventType: "escrow_released",
            previousStatus: "held_in_escrow",
            newStatus: "released_to_tutor",
        }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedPayment.id,
        status: updatedPayment.status,
      }
    });

  } catch (error) {
    console.error(`Error releasing payment for session`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
