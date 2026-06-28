import { NextRequest, NextResponse } from "next/server";
import prisma from "@ailearn/database";

export async function GET(req: NextRequest, { params }: any) {
  try {
    const tutor = await prisma.tutorProfile.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { fullName: true } },
        availability: {
          orderBy: [{ dayOfWeek: "asc" }, { startTimeUtc: "asc" }],
        },
      },
    });

    if (!tutor) {
      return NextResponse.json({ error: "Tutor not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        tutor: {
          name: tutor.user.fullName,
          hourlyRateCents: tutor.hourlyRateCents,
          trialRateCents: tutor.trialRateCents,
          currency: tutor.currency,
        },
        availability: tutor.availability.map((a: any) => ({
          dayOfWeek: a.dayOfWeek,
          startTimeUtc: a.startTimeUtc,
          endTimeUtc: a.endTimeUtc,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching tutor availability:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
