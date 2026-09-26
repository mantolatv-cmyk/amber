import { NextRequest, NextResponse } from "next/server";
import prisma from "@ailearn/database";
import { auth } from "../../../../auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        role: true,
        timezone: true,
        tutorProfile: {
          select: {
            id: true,
            headline: true,
            bio: true,
            hourlyRateCents: true,
            trialRateCents: true,
            videoIntroUrl: true,
            yearsExperience: true,
            status: true,
            stripeOnboarded: true,
            subjects: {
              include: {
                subject: {
                  select: { id: true, name: true, category: true }
                }
              }
            }
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        timezone: user.timezone,
        headline: user.tutorProfile?.headline || '',
        bio: user.tutorProfile?.bio || '',
        tutorProfile: user.tutorProfile || null,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
