import { Sparkles, Zap, MessageSquare, Edit3, Rocket, Code, Link as LinkIcon, BarChart, Plug, Database, BookOpen, Bot, Brain, Eye, Settings, Microscope, Star, Play, BookMarked, ArrowRight, Image as ImageIcon, LayoutGrid, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import styles from "./page.module.css";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";

// ============================================================
// Mock Data (will come from API in production)
// ============================================================

const SUBJECT_GROUPS = [
  {
    title: "Básico",
    description: "Ideal para iniciantes. Não exige conhecimento prévio de programação.",
    subjects: [
      { slug: "prompt-engineering", name: "Engenharia de Prompts", icon: <Sparkles size={24} />, color: "#6C5CE7", count: 124 },
      { slug: "ai-automation", name: "Automação com IA", icon: <Zap size={24} />, color: "#FFB830", count: 86 },
      { slug: "chatgpt-basics", name: "Introdução ao ChatGPT", icon: <MessageSquare size={24} />, color: "#00E676", count: 156 },
      { slug: "ai-content", name: "IA para Conteúdo", icon: <Edit3 size={24} />, color: "#FF6B6B", count: 92 },
      { slug: "ai-productivity", name: "Copilots e Produtividade", icon: <Rocket size={24} />, color: "#00D2FF", count: 110 },
      { slug: "ai-image-generation", name: "Geração de Imagens", icon: <ImageIcon size={24} />, color: "#A29BFE", count: 75 },
      { slug: "ai-everyday", name: "IA no Dia a Dia", icon: <LayoutGrid size={24} />, color: "#00B4D8", count: 134 },
      { slug: "ai-for-students", name: "IA para Estudantes", icon: <GraduationCap size={24} />, color: "#FF4757", count: 142 },
    ]
  },
  {
    title: "Intermediário",
    description: "Para quem já sabe programar e quer integrar IA em seus projetos.",
    subjects: [
      { slug: "ai-for-devs", name: "IA para Desenvolvedores", icon: <Code size={24} />, color: "#00D2FF", count: 98 },
      { slug: "langchain", name: "LangChain & LlamaIndex", icon: <LinkIcon size={24} />, color: "#00E676", count: 72 },
      { slug: "openai-apis", name: "Integração de APIs LLM", icon: <Plug size={24} />, color: "#6C5CE7", count: 104 },
    ]
  },
  {
    title: "Avançado",
    description: "Aprofunde-se em arquiteturas complexas, machine learning e IA generativa.",
    subjects: [
      { slug: "ai-agents", name: "AI Agents", icon: <Bot size={24} />, color: "#00B4D8", count: 91 },
      { slug: "fine-tuning", name: "Fine-tuning de LLMs", icon: <Brain size={24} />, color: "#FF6B6B", count: 54 },
    ]
  }
];

import prisma from "@ailearn/database";

// ============================================================
// Render Stars Helper
// ============================================================

function renderStars(rating: number): string {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  return "★".repeat(fullStars) + (hasHalf ? "½" : "") + "☆".repeat(5 - fullStars - (hasHalf ? 1 : 0));
}

// ============================================================
// Page Component
// ============================================================

export default async function Home() {
  const topTutors = await prisma.tutorProfile.findMany({
    where: { status: 'approved' },
    orderBy: { avgRating: 'desc' },
    take: 6,
    include: {
      user: { select: { fullName: true } },
      subjects: { include: { subject: { select: { name: true } } } },
      _count: { select: { reviews: true } }
    }
  });

  const totalTutors = await prisma.tutorProfile.count({ where: { status: 'approved' } });
  const totalStudents = await prisma.studentProfile.count();
  const avgRatingAggr = await prisma.tutorProfile.aggregate({ _avg: { avgRating: true } });
  const avgPlatformRating = avgRatingAggr._avg.avgRating ? Number(avgRatingAggr._avg.avgRating).toFixed(1) : "4.9";

  return (
    <>
      <Header
        variant="light"
        navLinks={[
          { label: 'Matérias', href: '#subjects' },
          { label: 'Tutores', href: '#tutors' },
          { label: 'Como Funciona', href: '#how-it-works' },
          { label: 'Para Empresas', href: '/enterprise' },
        ]}
      />

      {/* ---- Hero Section ---- */}
      <section className={styles.hero} id="hero">
        <div className={styles.heroMesh} />
        <div className={styles.heroGrid} />

        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} />
              Plataforma #1 de Ensino de IA no Brasil
            </div>

            <h1 className={styles.heroTitle}>
              Aprenda{" "}
              <span className={styles.heroTitleGradient}>
                Inteligência Artificial
              </span>{" "}
              na prática com Especialistas.
            </h1>

            <p className={styles.heroSubtitle}>
              Domine Engenharia de Prompts, Automação de Processos e Machine Learning com aulas particulares (1:1) ao vivo. Conecte-se com os melhores tutores de IA e acelere sua carreira.
            </p>

            <div className={styles.heroActions}>
              <a href="/search" className={`${styles.heroBtn} ${styles.heroBtnPrimary}`} id="hero-cta-search" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Encontrar um Tutor <ArrowRight size={16} />
              </a>
              <a href="#how-it-works" className={`${styles.heroBtn} ${styles.heroBtnSecondary}`} id="hero-cta-how" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Play size={16} /> Como Funciona
              </a>
            </div>

            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <span className={styles.heroStatValue}>{totalTutors > 0 ? totalTutors : '500+'}</span>
                <span className={styles.heroStatLabel}>Tutores</span>
              </div>
              <div className={styles.heroStat}>
                <span className={styles.heroStatValue}>{totalStudents > 0 ? totalStudents : '15k+'}</span>
                <span className={styles.heroStatLabel}>Alunos</span>
              </div>
              <div className={styles.heroStat}>
                <span className={styles.heroStatValue}>{avgPlatformRating}</span>
                <span className={styles.heroStatLabel}>Avaliação</span>
              </div>
            </div>
          </div>

          {/* Hero Images Collage */}
          <div className={styles.heroVisual}>
            <div className={`${styles.heroImageWrapper} ${styles.heroImage1}`}>
              <img 
                src="/hero-studying.png" 
                alt="Pessoas estudando concentradas em aulas" 
                className={styles.heroMainImage}
              />
            </div>
            <div className={`${styles.heroImageWrapper} ${styles.heroImage2}`}>
              <img 
                src="/hero-studying-2.png" 
                alt="Aluno aprendendo online" 
                className={styles.heroMainImage}
              />
            </div>
            <div className={`${styles.heroImageWrapper} ${styles.heroImage3}`}>
              <img 
                src="/hero-studying-3.png" 
                alt="Aluna interagindo com o tutor remoto" 
                className={styles.heroMainImage}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---- Subjects Section ---- */}
      <section className={styles.subjects} id="subjects">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionLabel} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><BookMarked size={16} /> Matérias</div>
          <h2 className={styles.sectionTitle}>Cursos e Aulas Particulares de IA</h2>
          <p className={styles.sectionSubtitle}>
            Explore nosso catálogo completo e encontre o professor particular de inteligência artificial ideal para seus objetivos profissionais.
          </p>
        </div>

        <div className={styles.subjectsContainer}>
          {SUBJECT_GROUPS.map((group) => (
            <div key={group.title} className={styles.subjectGroup}>
              <div className={styles.subjectGroupHeader}>
                <h3 className={styles.subjectGroupTitle}>{group.title}</h3>
                <p className={styles.subjectGroupDesc}>{group.description}</p>
              </div>
              <div className={styles.subjectsGrid}>
                {group.subjects.map((subject) => (
                  <a
                    key={subject.slug}
                    href={`/search?subject=${subject.slug}`}
                    className={styles.subjectCard}
                    id={`subject-${subject.slug}`}
                  >
                    <div
                      className={styles.subjectIcon}
                      style={{ background: `${subject.color}15`, color: subject.color }}
                    >
                      {subject.icon}
                    </div>
                    <div>
                      <div className={styles.subjectName}>{subject.name}</div>
                      <div className={styles.subjectCount}>{subject.count} tutores</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Featured Tutors Section ---- */}
      <section className={styles.tutors} id="tutors">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionLabel} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Star size={16} /> Destaque</div>
          <h2 className={styles.sectionTitle}>Tutores em Destaque</h2>
          <p className={styles.sectionSubtitle}>
            Conheça nossos tutores mais bem avaliados, prontos para ajudar você a dominar IA.
          </p>
        </div>

        <div className={styles.tutorsGrid}>
          {topTutors.map((tutor) => {
            const initials = tutor.user.fullName.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase();
            return (
              <div key={tutor.id} className={styles.tutorCard} id={`tutor-card-${tutor.id}`}>
                <div className={styles.tutorCardTop}>
                  <div className={styles.tutorAvatar}>
                    {initials}
                    <span className={styles.tutorOnline} />
                  </div>
                  <div className={styles.tutorInfo}>
                    <div className={styles.tutorName}>{tutor.user.fullName}</div>
                    <div className={styles.tutorHeadline}>{tutor.headline}</div>
                    <div className={styles.tutorRatingRow}>
                      <span className={styles.tutorStars}>{renderStars(Number(tutor.avgRating))}</span>
                      <span className={styles.tutorRatingValue}>{tutor.avgRating.toString()}</span>
                      <span className={styles.tutorReviewCount}>({tutor._count.reviews} avaliações)</span>
                    </div>
                  </div>
                </div>

                <div className={styles.tutorCardBody}>
                  <div className={styles.tutorTags}>
                    {tutor.subjects.slice(0, 2).map((s: any) => (
                      <span key={s.id} className={styles.tutorTag}>{s.subject.name}</span>
                    ))}
                    {tutor.subjects.length > 2 && (
                      <span className={styles.tutorTag}>+{tutor.subjects.length - 2}</span>
                    )}
                  </div>
                  <p className={styles.tutorBio}>{tutor.bio}</p>
                </div>

                <div className={styles.tutorCardFooter}>
                  <div className={styles.tutorPrice}>
                    <span className={styles.tutorPriceValue}>R$ {(tutor.hourlyRateCents / 100).toFixed(0)}</span>
                    <span className={styles.tutorPriceLabel}>por hora</span>
                  </div>
                  <Link href={`/tutor/${tutor.id}`} className="btn btn--secondary btn--sm">
                    Ver Perfil
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---- How It Works Section ---- */}
      <section className={styles.howItWorks} id="how-it-works">
        <div className={styles.sectionHeader}>
          <div className={styles.sectionLabel} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Rocket size={16} /> Processo</div>
          <h2 className={styles.sectionTitle}>Aulas de IA Online e Ao Vivo</h2>
          <p className={styles.sectionSubtitle}>
            Aprender inteligência artificial nunca foi tão fácil e seguro. Veja nosso processo passo a passo.
          </p>
        </div>

        <div className={styles.stepsGrid}>
          <div className={styles.stepCard}>
            <div className={`${styles.stepNumber} ${styles.stepNumber1}`}>1</div>
            <h3 className={styles.stepTitle}>Escolha um Tutor</h3>
            <p className={styles.stepDesc}>
              Pesquise por matéria, preço, horário e avaliações. Encontre o especialista ideal para você.
            </p>
          </div>

          <div className={styles.stepCard}>
            <div className={`${styles.stepNumber} ${styles.stepNumber2}`}>2</div>
            <h3 className={styles.stepTitle}>Agende uma Aula</h3>
            <p className={styles.stepDesc}>
              Escolha um horário que funcione para ambos. Pagamento seguro em escrow.
            </p>
          </div>

          <div className={styles.stepCard}>
            <div className={`${styles.stepNumber} ${styles.stepNumber3}`}>3</div>
            <h3 className={styles.stepTitle}>Aprenda ao Vivo</h3>
            <p className={styles.stepDesc}>
              Entre na sala virtual com vídeo, áudio e compartilhamento de tela. 100% personalizado.
            </p>
          </div>

          <div className={styles.stepCard}>
            <div className={`${styles.stepNumber} ${styles.stepNumber4}`}>4</div>
            <h3 className={styles.stepTitle}>Evolua Sempre</h3>
            <p className={styles.stepDesc}>
              Acompanhe seu progresso, avalie seu tutor e agende novas aulas para continuar evoluindo.
            </p>
          </div>
        </div>
      </section>

      {/* ---- CTA Section ---- */}
      <section className={styles.cta} id="cta">
        <div className={styles.ctaMesh} />
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>
            Domine a Inteligência Artificial e Destaque-se no Mercado
          </h2>
          <p className={styles.ctaSubtitle}>
            Junte-se a milhares de profissionais que estão transformando suas carreiras com nossos mentores e tutores especialistas em IA e automação.
          </p>
          <div className={styles.ctaActions}>
            <a href="/register" className={`${styles.heroBtn} ${styles.heroBtnPrimary}`} id="cta-register" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              Criar Conta Grátis <ArrowRight size={16} />
            </a>
            <a href="/search" className={`${styles.heroBtn} ${styles.heroBtnSecondary}`} id="cta-search">
              Explorar Tutores
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
