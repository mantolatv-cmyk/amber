import { NextRequest, NextResponse } from "next/server";
import prisma from "@ailearn/database";
import { isDatabaseReachable } from "../../../../../../lib/db-check";

const DEMO_TUTORS_AVAILABILITY: Record<string, any> = {
  "tutor-1": {
    name: "Lucas Mendes",
    headline: "Engenheiro de IA & Especialista em LLMs",
    hourlyRateCents: 14000,
    trialRateCents: 4900,
    currency: "BRL",
    subjectName: "LangChain & LlamaIndex",
    availability: [
      { dayOfWeek: 1, startTimeUtc: "09:00:00", endTimeUtc: "10:00:00" },
      { dayOfWeek: 1, startTimeUtc: "10:30:00", endTimeUtc: "11:30:00" },
      { dayOfWeek: 1, startTimeUtc: "14:00:00", endTimeUtc: "15:00:00" },
      { dayOfWeek: 1, startTimeUtc: "16:00:00", endTimeUtc: "17:00:00" },
      { dayOfWeek: 2, startTimeUtc: "10:00:00", endTimeUtc: "11:00:00" },
      { dayOfWeek: 2, startTimeUtc: "15:00:00", endTimeUtc: "16:00:00" },
      { dayOfWeek: 3, startTimeUtc: "09:00:00", endTimeUtc: "10:00:00" },
      { dayOfWeek: 3, startTimeUtc: "14:00:00", endTimeUtc: "15:00:00" },
      { dayOfWeek: 3, startTimeUtc: "19:00:00", endTimeUtc: "20:00:00" },
      { dayOfWeek: 4, startTimeUtc: "11:00:00", endTimeUtc: "12:00:00" },
      { dayOfWeek: 4, startTimeUtc: "16:30:00", endTimeUtc: "17:30:00" },
      { dayOfWeek: 5, startTimeUtc: "10:00:00", endTimeUtc: "11:00:00" },
      { dayOfWeek: 5, startTimeUtc: "14:00:00", endTimeUtc: "15:00:00" },
      { dayOfWeek: 6, startTimeUtc: "10:00:00", endTimeUtc: "11:00:00" },
    ]
  },
  "tutor-2": {
    name: "Beatriz Oliveira",
    headline: "Tech Lead de IA na Fintech X",
    hourlyRateCents: 16000,
    trialRateCents: 5900,
    currency: "BRL",
    subjectName: "Engenharia de Prompts",
    availability: [
      { dayOfWeek: 1, startTimeUtc: "14:00:00", endTimeUtc: "15:00:00" },
      { dayOfWeek: 2, startTimeUtc: "10:00:00", endTimeUtc: "11:00:00" },
      { dayOfWeek: 2, startTimeUtc: "15:00:00", endTimeUtc: "16:00:00" },
      { dayOfWeek: 3, startTimeUtc: "16:00:00", endTimeUtc: "17:00:00" },
      { dayOfWeek: 4, startTimeUtc: "09:30:00", endTimeUtc: "10:30:00" },
      { dayOfWeek: 4, startTimeUtc: "14:00:00", endTimeUtc: "15:00:00" },
      { dayOfWeek: 5, startTimeUtc: "11:00:00", endTimeUtc: "12:00:00" },
      { dayOfWeek: 6, startTimeUtc: "14:00:00", endTimeUtc: "15:00:00" },
    ]
  },
  "tutor-3": {
    name: "Rodrigo Silva",
    headline: "Data Scientist Sênior & Especialista em Computer Vision",
    hourlyRateCents: 12000,
    trialRateCents: 3900,
    currency: "BRL",
    subjectName: "Fine-tuning de LLMs",
    availability: [
      { dayOfWeek: 1, startTimeUtc: "08:00:00", endTimeUtc: "09:00:00" },
      { dayOfWeek: 2, startTimeUtc: "14:00:00", endTimeUtc: "15:00:00" },
      { dayOfWeek: 3, startTimeUtc: "10:00:00", endTimeUtc: "11:00:00" },
      { dayOfWeek: 4, startTimeUtc: "18:00:00", endTimeUtc: "19:00:00" },
      { dayOfWeek: 5, startTimeUtc: "15:00:00", endTimeUtc: "16:00:00" },
    ]
  },
  "default": {
    name: "Marina Costa",
    headline: "Engenheira de Machine Learning & Tutora Sênior",
    hourlyRateCents: 15000,
    trialRateCents: 4900,
    currency: "BRL",
    subjectName: "IA para Desenvolvedores",
    availability: [
      { dayOfWeek: 1, startTimeUtc: "09:00:00", endTimeUtc: "10:00:00" },
      { dayOfWeek: 1, startTimeUtc: "14:00:00", endTimeUtc: "15:00:00" },
      { dayOfWeek: 2, startTimeUtc: "11:00:00", endTimeUtc: "12:00:00" },
      { dayOfWeek: 3, startTimeUtc: "10:00:00", endTimeUtc: "11:00:00" },
      { dayOfWeek: 3, startTimeUtc: "16:00:00", endTimeUtc: "17:00:00" },
      { dayOfWeek: 4, startTimeUtc: "14:00:00", endTimeUtc: "15:00:00" },
      { dayOfWeek: 5, startTimeUtc: "09:00:00", endTimeUtc: "10:00:00" },
      { dayOfWeek: 5, startTimeUtc: "15:00:00", endTimeUtc: "16:00:00" },
      { dayOfWeek: 6, startTimeUtc: "10:00:00", endTimeUtc: "11:00:00" },
    ]
  }
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const dbOnline = await isDatabaseReachable();

    if (dbOnline) {
      try {
        const tutor = await prisma.tutorProfile.findUnique({
          where: { id },
          include: {
            user: { select: { fullName: true } },
            subjects: { include: { subject: { select: { name: true } } } },
            availability: {
              orderBy: [{ dayOfWeek: "asc" }, { startTimeUtc: "asc" }],
            },
          },
        });

        if (tutor) {
          return NextResponse.json({
            success: true,
            data: {
              tutor: {
                id: tutor.id,
                name: tutor.user.fullName,
                headline: tutor.headline,
                hourlyRateCents: tutor.hourlyRateCents,
                trialRateCents: tutor.trialRateCents,
                currency: tutor.currency,
                subjectName: tutor.subjects?.[0]?.subject?.name || "Inteligência Artificial",
              },
              availability: tutor.availability.map((a: any) => ({
                dayOfWeek: a.dayOfWeek,
                startTimeUtc: a.startTimeUtc,
                endTimeUtc: a.endTimeUtc,
              })),
            },
          });
        }
      } catch (dbErr) {
        console.warn("Database error in tutor availability route, using demo:", dbErr);
      }
    }

    // Return rich demo tutor availability
    const demoData = DEMO_TUTORS_AVAILABILITY[id] || {
      ...DEMO_TUTORS_AVAILABILITY["default"],
    };

    return NextResponse.json({
      success: true,
      data: {
        tutor: {
          id,
          name: demoData.name,
          headline: demoData.headline,
          hourlyRateCents: demoData.hourlyRateCents,
          trialRateCents: demoData.trialRateCents,
          currency: demoData.currency,
          subjectName: demoData.subjectName,
        },
        availability: demoData.availability,
      },
    });
  } catch (error) {
    console.error("Error fetching tutor availability:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
