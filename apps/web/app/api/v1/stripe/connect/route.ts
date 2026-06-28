import { NextRequest, NextResponse } from "next/server";
import prisma from "@ailearn/database";
import { requireAuth, generateUnauthorizedResponse } from "../../auth";
import { stripe } from "@ailearn/shared";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return generateUnauthorizedResponse();

    if (auth.role !== "tutor") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: auth.userId },
    });

    if (!tutorProfile) {
      return NextResponse.json({ error: "Tutor profile not found" }, { status: 404 });
    }

    let accountId = tutorProfile.stripeAccountId;

    // Create a Stripe Connect Express account if one doesn't exist
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: auth.email, // Assume the auth object provides the user's email or we fetch it.
        capabilities: {
          transfers: { requested: true },
        },
      });

      accountId = account.id;

      await prisma.tutorProfile.update({
        where: { id: tutorProfile.id },
        data: { stripeAccountId: accountId },
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Generate onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/dashboard/tutor/stripe?refresh=true`,
      return_url: `${appUrl}/dashboard/tutor/stripe?success=true`,
      type: "account_onboarding",
    });

    return NextResponse.json({ success: true, url: accountLink.url });
  } catch (error) {
    console.error("Stripe Connect error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
