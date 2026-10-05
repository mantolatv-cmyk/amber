import { NextRequest, NextResponse } from "next/server";
import prisma from "@ailearn/database";
import { TutorSearchSchema } from "@ailearn/shared";
import { isDatabaseReachable } from "../../../../../lib/db-check";


const DEMO_TUTORS = [
  {
    id: "tutor-1",
    userId: "user-1",
    name: "Lucas Mendes",
    headline: "Engenheiro de IA & Especialista em LLMs",
    bio: "Pesquisador com 6+ anos de experiência. Ajudo desenvolvedores a construir sistemas de IA generativa e RAG com LangChain e LlamaIndex.",
    hourlyRateCents: 14000,
    trialRateCents: 4900,
    avgRating: 4.9,
    totalSessions: 38,
    subjects: ["LangChain & LlamaIndex", "RAG Architecture", "Engenharia de Prompts"],
  },
  {
    id: "tutor-2",
    userId: "user-2",
    name: "Beatriz Oliveira",
    headline: "Tech Lead de IA na Fintech X",
    bio: "Especialista em automações corporativas com OpenAI e Claude. Foco em aplicações práticas de IA para empresas e times de engenharia.",
    hourlyRateCents: 16000,
    trialRateCents: 5900,
    avgRating: 5.0,
    totalSessions: 46,
    subjects: ["Automação com IA", "Engenharia de Prompts", "IA para Desenvolvedores"],
  },
  {
    id: "tutor-3",
    userId: "user-3",
    name: "Rodrigo Silva",
    headline: "Data Scientist Sênior & Mestre em Computação (USP)",
    bio: "Ensino desde fundamentos de Python e Machine Learning até fine-tuning de modelos abertos como Llama 3 e DeepSeek.",
    hourlyRateCents: 12000,
    trialRateCents: 3900,
    avgRating: 4.8,
    totalSessions: 22,
    subjects: ["Fine-tuning de LLMs", "IA para Desenvolvedores", "AI Agents"],
  },
  {
    id: "tutor-4",
    userId: "user-4",
    name: "Mariana Costa",
    headline: "Especialista em AI Agents e Arquiteturas Multi-Agente",
    bio: "Ajudo engenheiros e fundadores a implementar agentes autônomos com AutoGen, CrewAI e LangGraph.",
    hourlyRateCents: 18000,
    trialRateCents: 6500,
    avgRating: 4.9,
    totalSessions: 31,
    subjects: ["AI Agents", "LangChain & LlamaIndex", "Automação com IA"],
  }
];

function filterDemoTutors(searchParams: URLSearchParams) {
  const query = searchParams.get("q");
  const subject = searchParams.get("subject");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const minRating = searchParams.get("minRating");
  const sort = searchParams.get("sort") || "rating";

  let filtered = [...DEMO_TUTORS];

  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(t => 
      t.name.toLowerCase().includes(q) || 
      t.headline.toLowerCase().includes(q) || 
      t.subjects.some(s => s.toLowerCase().includes(q))
    );
  }

  if (subject) {
    const sub = subject.toLowerCase().replace(/-/g, ' ');
    filtered = filtered.filter(t => 
      t.subjects.some(s => s.toLowerCase().includes(sub) || sub.includes(s.toLowerCase()))
    );
  }

  if (minRating) {
    filtered = filtered.filter(t => t.avgRating >= parseFloat(minRating));
  }

  if (minPrice) {
    filtered = filtered.filter(t => t.hourlyRateCents >= parseInt(minPrice, 10) * 100);
  }

  if (maxPrice) {
    filtered = filtered.filter(t => t.hourlyRateCents <= parseInt(maxPrice, 10) * 100);
  }

  if (sort === "price_asc") {
    filtered.sort((a, b) => a.hourlyRateCents - b.hourlyRateCents);
  } else if (sort === "price_desc") {
    filtered.sort((a, b) => b.hourlyRateCents - a.hourlyRateCents);
  } else {
    filtered.sort((a, b) => b.avgRating - a.avgRating);
  }

  return filtered;
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  // Ultra-fast check: if database is offline, respond in < 5ms with demo catalog
  const dbOnline = await isDatabaseReachable();
  if (!dbOnline) {
    const filtered = filterDemoTutors(searchParams);
    return NextResponse.json({
      success: true,
      data: filtered,
      meta: { total: filtered.length }
    });
  }

  try {
    const rawParams = Object.fromEntries(searchParams.entries());
    const parsed = TutorSearchSchema.safeParse(rawParams);

    const subject = parsed.success ? parsed.data.subject : searchParams.get("subject");
    const minPrice = parsed.success ? parsed.data.priceMin?.toString() : searchParams.get("minPrice");
    const maxPrice = parsed.success ? parsed.data.priceMax?.toString() : searchParams.get("maxPrice");
    const minRating = parsed.success ? parsed.data.ratingMin?.toString() : searchParams.get("minRating");
    const query = parsed.success ? parsed.data.q : searchParams.get("q");
    const sort = parsed.success ? parsed.data.sortBy : searchParams.get("sort");

    // Build Prisma query dynamically
    const whereClause: any = {
      status: "approved",
    };

    if (query) {
      whereClause.OR = [
        { user: { fullName: { contains: query, mode: "insensitive" } } },
        { headline: { contains: query, mode: "insensitive" } },
      ];
    }

    if (subject) {
      whereClause.subjects = {
        some: {
          subject: {
            slug: subject,
          },
        },
      };
    }

    if (minPrice) {
      whereClause.hourlyRateCents = {
        ...whereClause.hourlyRateCents,
        gte: parseInt(minPrice, 10) * 100,
      };
    }

    if (maxPrice) {
      whereClause.hourlyRateCents = {
        ...whereClause.hourlyRateCents,
        lte: parseInt(maxPrice, 10) * 100,
      };
    }

    if (minRating) {
      whereClause.avgRating = {
        gte: parseFloat(minRating),
      };
    }

    let orderBy: any = { avgRating: "desc" };
    if (sort === "price_asc") {
      orderBy = { hourlyRateCents: "asc" };
    } else if (sort === "price_desc") {
      orderBy = { hourlyRateCents: "desc" };
    }

    const tutors = await prisma.tutorProfile.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            fullName: true,
            avatarUrl: true,
          },
        },
        subjects: {
          include: {
            subject: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy,
      take: 20,
    });

    const formattedTutors = tutors.map((tutor: any) => ({
      id: tutor.id,
      userId: tutor.userId,
      name: tutor.user.fullName,
      avatarUrl: tutor.user.avatarUrl,
      headline: tutor.headline,
      bio: tutor.bio,
      hourlyRateCents: tutor.hourlyRateCents,
      trialRateCents: tutor.trialRateCents,
      avgRating: Number(tutor.avgRating),
      totalSessions: tutor.totalSessions,
      subjects: tutor.subjects.map((s: any) => s.subject.name),
    }));

    return NextResponse.json({
      success: true,
      data: formattedTutors,
      meta: {
        total: formattedTutors.length,
      }
    });

  } catch {
    const filtered = filterDemoTutors(searchParams);
    return NextResponse.json({
      success: true,
      data: filtered,
      meta: { total: filtered.length }
    });
  }
}
