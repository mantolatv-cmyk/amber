import { NextRequest, NextResponse } from "next/server";
import prisma from "@ailearn/database";
import { isDatabaseReachable } from "../../../../../lib/db-check";

interface TutorMatchCandidate {
  id: string;
  name: string;
  avatarUrl: string | null;
  headline: string;
  bio: string;
  hourlyRateCents: number;
  trialRateCents: number | null;
  avgRating: number;
  totalSessions: number;
  subjects: string[];
  specialties: string[];
}

const CATALOG_TUTORS: TutorMatchCandidate[] = [
  {
    id: "tutor-1",
    name: "Lucas Mendes",
    avatarUrl: null,
    headline: "Engenheiro de IA & Especialista em LLMs",
    bio: "Mais de 6 anos desenvolvendo soluções com LLMs, Python, LangChain e arquiteturas RAG para grandes fintechs. Foco em código em produção.",
    hourlyRateCents: 14000,
    trialRateCents: 4900,
    avgRating: 4.95,
    totalSessions: 142,
    subjects: ["LangChain & LlamaIndex", "RAG Architecture", "AI Agents"],
    specialties: ["langchain", "rag", "llamaindex", "agentes", "vector database", "pinecone", "chromadb", "python", "embeddings", "producao"]
  },
  {
    id: "tutor-2",
    name: "Beatriz Oliveira",
    avatarUrl: null,
    headline: "Tech Lead de IA na Fintech X",
    bio: "Especialista em Engenharia de Prompts avançada, avaliações de LLM e automações empresariais. Mentoria focada em carreira e projetos práticos.",
    hourlyRateCents: 16000,
    trialRateCents: 5900,
    avgRating: 4.98,
    totalSessions: 189,
    subjects: ["Engenharia de Prompts", "Automação com IA", "IA para Desenvolvedores"],
    specialties: ["prompt engineering", "few-shot", "evals", "chatgpt", "claude", "automacao", "make", "n8n", "carreira", "entrevistas"]
  },
  {
    id: "tutor-3",
    name: "Rodrigo Silva",
    avatarUrl: null,
    headline: "Data Scientist Sênior & Especialista em Computer Vision & Fine-tuning",
    bio: "Mestre em Ciência da Computação pela USP. Atua com fine-tuning de modelos abertos (Llama 3, Mistral, Qwen) e visão computacional aplicada.",
    hourlyRateCents: 12000,
    trialRateCents: 3900,
    avgRating: 4.88,
    totalSessions: 96,
    subjects: ["Fine-tuning de LLMs", "IA para Desenvolvedores", "Introdução ao ChatGPT"],
    specialties: ["fine-tuning", "lora", "qlora", "llama", "huggingface", "pytorch", "visao computacional", "modelos abertos", "gpu", "deep learning"]
  },
  {
    id: "default",
    name: "Marina Costa",
    avatarUrl: null,
    headline: "Engenheira de Machine Learning & Tutora Sênior",
    bio: "Instrutora de IA para mais de 500 desenvolvedores. Especialista em guiar iniciantes e transições de carreira para Inteligência Artificial.",
    hourlyRateCents: 15000,
    trialRateCents: 4900,
    avgRating: 5.0,
    totalSessions: 215,
    subjects: ["IA para Desenvolvedores", "Introdução ao ChatGPT", "RAG Architecture"],
    specialties: ["iniciante", "do zero", "python", "transicao de carreira", "fundamentos", "chatgpt", "openai api", "boas praticas", "didatica"]
  }
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = (body.prompt || "").trim();

    if (!prompt) {
      return NextResponse.json(
        { error: "Bad Request", message: "O prompt de busca é obrigatório." },
        { status: 400 }
      );
    }

    const lowerPrompt = prompt.toLowerCase();

    // 1. Identify goal and keywords
    const keywords: string[] = [];
    const keywordMap: Record<string, string[]> = {
      rag: ["rag", "retrieval", "vector", "vetorial", "pinecone", "chroma", "embeddings", "documentos"],
      langchain: ["langchain", "llamaindex", "agente", "agent", "tool", "fluxo"],
      prompts: ["prompt", "engenharia de prompt", "few-shot", "system prompt", "chatgpt"],
      fine_tuning: ["fine-tuning", "treinar", "treinamento", "lora", "qlora", "llama", "mistral", "huggingface"],
      beginner: ["do zero", "iniciante", "começando", "aprender ia", "primeira vez", "básico"],
      career: ["entrevista", "carreira", "vaga", "portfolio", "senior", "tech lead"],
      automation: ["automação", "automacao", "whatsapp", "bot", "webhook", "n8n"]
    };

    for (const [key, terms] of Object.entries(keywordMap)) {
      if (terms.some(t => lowerPrompt.includes(t))) {
        keywords.push(key);
      }
    }

    // 2. Score candidates
    const scoredTutors = CATALOG_TUTORS.map((tutor) => {
      let score = 70; // baseline

      // Match specialties
      for (const specialty of tutor.specialties) {
        if (lowerPrompt.includes(specialty)) {
          score += 8;
        }
      }

      // Match subjects
      for (const subject of tutor.subjects) {
        if (lowerPrompt.includes(subject.toLowerCase())) {
          score += 10;
        }
      }

      // Contextual boosts
      if (keywords.includes("langchain") || keywords.includes("rag")) {
        if (tutor.id === "tutor-1") score += 15;
      }
      if (keywords.includes("prompts") || keywords.includes("career") || keywords.includes("automation")) {
        if (tutor.id === "tutor-2") score += 15;
      }
      if (keywords.includes("fine_tuning")) {
        if (tutor.id === "tutor-3") score += 20;
      }
      if (keywords.includes("beginner")) {
        if (tutor.id === "default") score += 18;
      }

      // Rating bonus
      score += Math.round(tutor.avgRating * 2);

      // Clamp score between 82% and 99%
      const matchPercentage = Math.min(99, Math.max(82, score));

      // Generate personalized match reasons
      let matchReason = "";
      let learningRoadmap: string[] = [];

      if (tutor.id === "tutor-1") {
        matchReason = "Possui vasta experiência na implementação de pipelines RAG em produção e criação de agentes autônomos com LangChain & Python.";
        learningRoadmap = [
          "Alinhamento da arquitetura do projeto e escolha do banco vetorial",
          "Construção do pipeline de ingestão e chunking de documentos",
          "Implementação do agente com memória e chamada de ferramentas (tools)"
        ];
      } else if (tutor.id === "tutor-2") {
        matchReason = "Especialista em orquestração de prompts, engenharia de contexto e automações corporativas com LLMs de alto desempenho.";
        learningRoadmap = [
          "Estruturação de prompts eficientes com few-shot e restrições rígidas",
          "Integração de APIs de LLM com webhooks e automação de processos",
          "Testes de qualidade e estratégias de avaliação (evals) para produção"
        ];
      } else if (tutor.id === "tutor-3") {
        matchReason = "Mestre pela USP focado em customização de modelos open-source (Llama, Mistral) com técnicas modernas de quantização e fine-tuning.";
        learningRoadmap = [
          "Preparação e curadoria do dataset de treinamento para o seu nicho",
          "Configuração de pipeline com QLoRA, Hugging Face e PyTorch",
          "Inferência otimizada e deploy do modelo customizado em nuvem"
        ];
      } else {
        matchReason = "Instrutora de referência para desenvolvedores que querem dominar IA prática com didática passo a passo e projetos reais.";
        learningRoadmap = [
          "Fundamentos essenciais da API da OpenAI e ecossistema moderno de IA",
          "Construção do primeiro protótipo funcional orientado ao seu objetivo",
          "Melhores práticas de segurança, controle de custos e próximas etapas"
        ];
      }

      return {
        ...tutor,
        matchPercentage,
        matchReason,
        learningRoadmap
      };
    });

    // Sort by match score descending
    scoredTutors.sort((a, b) => b.matchPercentage - a.matchPercentage);

    const identifiedGoal = keywords.length > 0 
      ? `Foco identificado: ${keywords.map(k => k.replace('_', ' ').toUpperCase()).join(', ')}`
      : "Desenvolvimento de Projeto & Mentoria em Inteligência Artificial";

    const recommendedLevel = lowerPrompt.includes("iniciante") || lowerPrompt.includes("do zero")
      ? "Iniciante"
      : lowerPrompt.includes("avanc") || lowerPrompt.includes("producao") || lowerPrompt.includes("fine-tuning")
        ? "Avançado"
        : "Intermediário";

    return NextResponse.json({
      success: true,
      data: {
        matches: scoredTutors.slice(0, 3),
        analysis: {
          prompt,
          identifiedGoal,
          recommendedLevel,
          keywords
        }
      }
    });

  } catch (error) {
    console.error("Error in /api/v1/tutors/match:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
