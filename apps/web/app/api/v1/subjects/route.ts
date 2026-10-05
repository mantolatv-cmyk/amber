import { NextResponse } from "next/server";
import prisma from "@ailearn/database";
import { isDatabaseReachable } from "../../../../lib/db-check";

const FALLBACK_SUBJECTS = [
  { id: "1", slug: "prompt-engineering", name: "Engenharia de Prompts", category: "Básico", count: 12 },
  { id: "2", slug: "ai-for-devs", name: "IA para Desenvolvedores", category: "Intermediário", count: 18 },
  { id: "3", slug: "langchain", name: "LangChain & LlamaIndex", category: "Intermediário", count: 9 },
  { id: "4", slug: "rag-architecture", name: "RAG Architecture", category: "Avançado", count: 14 },
  { id: "5", slug: "ai-agents", name: "AI Agents", category: "Avançado", count: 11 },
  { id: "6", slug: "fine-tuning", name: "Fine-tuning de LLMs", category: "Avançado", count: 7 },
  { id: "7", slug: "ai-automation", name: "Automação com IA", category: "Básico", count: 15 },
  { id: "8", slug: "chatgpt-basics", name: "Introdução ao ChatGPT", category: "Básico", count: 8 },
];

export async function GET() {
  const dbOnline = await isDatabaseReachable();
  if (!dbOnline) {
    return NextResponse.json({ success: true, data: FALLBACK_SUBJECTS });
  }

  try {
    const subjects = await prisma.subject.findMany({

      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        category: true,
        description: true,
        _count: {
          select: {
            tutors: {
              where: { tutor: { status: "approved" } },
            },
          },
        },
      },
    });

    const formatted = subjects.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      category: s.category,
      description: s.description,
      count: s._count?.tutors ?? 0,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.warn("Database unreachable in /api/v1/subjects, using catalog fallback:", error);
    const FALLBACK_SUBJECTS = [
      { id: "1", slug: "prompt-engineering", name: "Engenharia de Prompts", category: "Básico", count: 12 },
      { id: "2", slug: "ai-for-devs", name: "IA para Desenvolvedores", category: "Intermediário", count: 18 },
      { id: "3", slug: "langchain", name: "LangChain & LlamaIndex", category: "Intermediário", count: 9 },
      { id: "4", slug: "rag-architecture", name: "RAG Architecture", category: "Avançado", count: 14 },
      { id: "5", slug: "ai-agents", name: "AI Agents", category: "Avançado", count: 11 },
      { id: "6", slug: "fine-tuning", name: "Fine-tuning de LLMs", category: "Avançado", count: 7 },
      { id: "7", slug: "ai-automation", name: "Automação com IA", category: "Básico", count: 15 },
      { id: "8", slug: "chatgpt-basics", name: "Introdução ao ChatGPT", category: "Básico", count: 8 },
    ];
    return NextResponse.json({ success: true, data: FALLBACK_SUBJECTS });
  }
}


