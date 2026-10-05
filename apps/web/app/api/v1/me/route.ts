import { NextRequest, NextResponse } from "next/server";
import prisma from "@ailearn/database";
import { auth } from "../../../../auth";
import { isDatabaseReachable } from "../../../../lib/db-check";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbOnline = await isDatabaseReachable();
    if (!dbOnline) {
      const isTutor = (session.user as any).role === "tutor";
      return NextResponse.json({
        success: true,
        data: {
          id: session.user.id,
          email: session.user.email || "usuario@example.com",
          fullName: session.user.name || "Usuário OpenLearn",
          avatarUrl: session.user.image || null,
          role: (session.user as any).role || "student",
          timezone: "America/Sao_Paulo",
          headline: isTutor ? "Engenheiro de IA & Especialista em LLMs" : "Estudante de Inteligência Artificial",
          bio: isTutor 
            ? "Mais de 6 anos desenvolvendo soluções com LLMs, Python, LangChain e arquiteturas RAG."
            : "Entusiasta de machine learning focado em aplicações práticas e agentes autônomos.",
          tutorProfile: isTutor ? {
            id: "tutor-1",
            headline: "Engenheiro de IA & Especialista em LLMs",
            bio: "Mais de 6 anos desenvolvendo soluções com LLMs, Python, LangChain e arquiteturas RAG.",
            hourlyRateCents: 14000,
            trialRateCents: 4900,
            videoIntroUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            yearsExperience: 6,
            status: "approved",
            stripeOnboarded: true,
            subjects: [
              {
                subject: {
                  id: "sub-1",
                  name: "LangChain & LlamaIndex",
                  category: "AI Engineering"
                }
              },
              {
                subject: {
                  id: "sub-2",
                  name: "Engenharia de Prompts",
                  category: "LLM Fundamentals"
                }
              }
            ]
          } : null,
        }
      });
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
