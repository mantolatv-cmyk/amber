/**
 * Prisma Seed Script
 *
 * Populates the database with realistic sample data for development.
 * Run: npx prisma db seed (or npm run db:seed from root)
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ============================================================
  // Subjects
  // ============================================================
  const subjects = await Promise.all([
    prisma.subject.upsert({
      where: { slug: 'prompt-engineering' },
      update: {},
      create: {
        slug: 'prompt-engineering',
        name: 'Engenharia de Prompts',
        category: 'Engenharia de Prompts',
        description: 'Aprenda técnicas avançadas de prompting: Chain-of-Thought, Tree-of-Thought, ReAct, e mais.',
        sortOrder: 1,
      },
    }),
    prisma.subject.upsert({
      where: { slug: 'ai-for-devs' },
      update: {},
      create: {
        slug: 'ai-for-devs',
        name: 'IA para Desenvolvedores',
        category: 'Desenvolvimento com IA',
        description: 'Integre LLMs em aplicações reais com TypeScript, Python e APIs.',
        sortOrder: 2,
      },
    }),
    prisma.subject.upsert({
      where: { slug: 'ai-automation' },
      update: {},
      create: {
        slug: 'ai-automation',
        name: 'Automação com IA',
        category: 'Automação com IA',
        description: 'Automatize processos com IA generativa, Make, Zapier e custom APIs.',
        sortOrder: 3,
      },
    }),
    prisma.subject.upsert({
      where: { slug: 'langchain' },
      update: {},
      create: {
        slug: 'langchain',
        name: 'LangChain & LlamaIndex',
        category: 'Desenvolvimento com IA',
        description: 'Construa aplicações LLM com os frameworks mais populares do mercado.',
        sortOrder: 4,
      },
    }),
    prisma.subject.upsert({
      where: { slug: 'fine-tuning' },
      update: {},
      create: {
        slug: 'fine-tuning',
        name: 'Fine-tuning de LLMs',
        category: 'Machine Learning',
        description: 'Aprenda a customizar modelos de linguagem para seu caso de uso.',
        sortOrder: 5,
      },
    }),
    prisma.subject.upsert({
      where: { slug: 'rag-architecture' },
      update: {},
      create: {
        slug: 'rag-architecture',
        name: 'RAG Architecture',
        category: 'IA Generativa',
        description: 'Construa pipelines de Retrieval-Augmented Generation para produção.',
        sortOrder: 6,
      },
    }),
    prisma.subject.upsert({
      where: { slug: 'ai-agents' },
      update: {},
      create: {
        slug: 'ai-agents',
        name: 'AI Agents',
        category: 'IA Generativa',
        description: 'Crie agentes autônomos com ferramentas, memória e planejamento.',
        sortOrder: 7,
      },
    }),
    prisma.subject.upsert({
      where: { slug: 'computer-vision' },
      update: {},
      create: {
        slug: 'computer-vision',
        name: 'Computer Vision',
        category: 'Machine Learning',
        description: 'Deep learning para imagens: CNNs, YOLO, SAM, DINO e Stable Diffusion.',
        sortOrder: 8,
      },
    }),
  ]);

  console.log(`✅ Created ${subjects.length} subjects`);

  // ============================================================
  // Commission Tiers
  // ============================================================
  await prisma.commissionTier.createMany({
    data: [
      { minSessions: 0, maxSessions: 50, platformFeePct: 33.00 },
      { minSessions: 51, maxSessions: 200, platformFeePct: 25.00 },
      { minSessions: 201, maxSessions: null, platformFeePct: 18.00 },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Created commission tiers');

  // ============================================================
  // Sample Users + Tutor Profiles
  // ============================================================
  const defaultPasswordHash = await bcrypt.hash('123456', 10);

  const tutorUsers = [
    {
      passwordHash: defaultPasswordHash,
      email: 'marina.costa@example.com',
      fullName: 'Marina Costa',
      role: 'tutor' as const,
      timezone: 'America/Sao_Paulo',
      emailVerified: true,
      profile: {
        headline: 'Engenheira de Prompts Sênior | Ex-Google DeepMind',
        bio: 'Mais de 8 anos trabalhando com NLP e modelos generativos.',
        hourlyRateCents: 15000,
        trialRateCents: 5000,
        yearsExperience: 8,
        status: 'approved' as const,
        totalSessions: 512,
        avgRating: 4.97,
        responseTimeMins: 15,
        subjectSlugs: ['prompt-engineering', 'rag-architecture'],
      },
    },
    {
      passwordHash: defaultPasswordHash,
      email: 'rafael.oliveira@example.com',
      fullName: 'Rafael Oliveira',
      role: 'tutor' as const,
      timezone: 'America/Sao_Paulo',
      emailVerified: true,
      profile: {
        headline: 'AI Engineer | Fundador da AIStack | YouTuber 100k+',
        bio: 'Ensino IA de forma prática com projetos reais.',
        hourlyRateCents: 12000,
        trialRateCents: 3500,
        yearsExperience: 6,
        status: 'approved' as const,
        totalSessions: 398,
        avgRating: 4.93,
        responseTimeMins: 20,
        subjectSlugs: ['langchain', 'ai-agents'],
      },
    },
    {
      passwordHash: defaultPasswordHash,
      email: 'pedro.almeida@example.com',
      fullName: 'Pedro Almeida',
      role: 'tutor' as const,
      timezone: 'America/Sao_Paulo',
      emailVerified: true,
      profile: {
        headline: 'Senior Developer & AI Educator | Microsoft MVP',
        bio: 'Transformo desenvolvedores em AI Engineers.',
        hourlyRateCents: 16000,
        trialRateCents: 5500,
        yearsExperience: 10,
        status: 'approved' as const,
        totalSessions: 678,
        avgRating: 4.95,
        responseTimeMins: 10,
        subjectSlugs: ['ai-for-devs', 'prompt-engineering'],
      },
    },
    {
      passwordHash: defaultPasswordHash,
      email: 'ana.silva@example.com',
      fullName: 'Ana Beatriz Silva',
      role: 'tutor' as const,
      timezone: 'America/Sao_Paulo',
      emailVerified: true,
      profile: {
        headline: 'ML Engineer @ Nubank | MSc em Ciência da Computação USP',
        bio: 'Especialista em deploy de modelos em produção. Ensino desde fundamentos até MLOps avançado.',
        hourlyRateCents: 18000,
        trialRateCents: 6000,
        yearsExperience: 5,
        status: 'approved' as const,
        totalSessions: 289,
        avgRating: 4.88,
        responseTimeMins: 45,
        subjectSlugs: ['ai-for-devs', 'fine-tuning'],
      },
    },
    {
      passwordHash: defaultPasswordHash,
      email: 'lucas.mendes@example.com',
      fullName: 'Lucas Mendes',
      role: 'tutor' as const,
      timezone: 'America/Sao_Paulo',
      emailVerified: true,
      profile: {
        headline: 'Consultor de Automação IA | 15+ clientes enterprise',
        bio: 'Ajudo profissionais e empresas a automatizar processos complexos usando IA generativa.',
        hourlyRateCents: 13000,
        trialRateCents: 4000,
        yearsExperience: 4,
        status: 'approved' as const,
        totalSessions: 445,
        avgRating: 4.91,
        responseTimeMins: 10,
        subjectSlugs: ['ai-automation', 'ai-agents'],
      },
    },
    {
      passwordHash: defaultPasswordHash,
      email: 'camila.ferreira@example.com',
      fullName: 'Camila Ferreira',
      role: 'tutor' as const,
      timezone: 'America/Sao_Paulo',
      emailVerified: true,
      profile: {
        headline: 'Computer Vision Researcher | PhD UNICAMP',
        bio: 'Pesquisadora em visão computacional e deep learning.',
        hourlyRateCents: 20000,
        trialRateCents: 7000,
        yearsExperience: 7,
        status: 'approved' as const,
        totalSessions: 167,
        avgRating: 4.85,
        responseTimeMins: 60,
        subjectSlugs: ['computer-vision', 'fine-tuning'],
      },
    },
  ];

  for (const tutorData of tutorUsers) {
    const { profile, ...userData } = tutorData;
    const { subjectSlugs, ...profileData } = profile;

    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });

    const tutorProfile = await prisma.tutorProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        ...profileData,
      },
    });

    // Link subjects
    for (const slug of subjectSlugs) {
      const subject = subjects.find((s) => s.slug === slug);
      if (subject) {
        await prisma.tutorSubject.upsert({
          where: {
            tutorId_subjectId: { tutorId: tutorProfile.id, subjectId: subject.id },
          },
          update: {},
          create: { tutorId: tutorProfile.id, subjectId: subject.id },
        });
      }
    }

    console.log(`✅ Created tutor: ${userData.fullName}`);
  }

  // ============================================================
  // Sample Student
  // ============================================================
  const student = await prisma.user.upsert({
    where: { email: 'aluno@example.com' },
    update: {},
    create: {
      passwordHash: defaultPasswordHash,
      email: 'aluno@example.com',
      fullName: 'João Aluno Demo',
      role: 'student',
      timezone: 'America/Sao_Paulo',
      emailVerified: true,
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      learningGoals: 'Quero aprender engenharia de prompts para aplicar no meu trabalho como dev.',
      proficiencyLevel: 'intermediate',
    },
  });

  console.log(`✅ Created student: ${student.fullName}`);

  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
