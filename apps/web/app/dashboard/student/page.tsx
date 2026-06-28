import React from 'react';
import Link from 'next/link';
import { Play, History, CheckCircle, Circle, Target, Search, CalendarX } from 'lucide-react';
import prisma from '@ailearn/database';
import { auth } from '../../../auth';
import { redirect } from 'next/navigation';
import WelcomeToast from './WelcomeToast';
import LearningGoals from './LearningGoals';
import NextClassCard from './NextClassCard';
import { ReviewButton } from '../sessions/SessionButtons';
import styles from './student.module.css';

export default async function StudentDashboard() {
  const sessionAuth = await auth();
  
  if (sessionAuth?.user?.role !== 'student') {
    redirect('/dashboard/tutor');
  }

  const userId = sessionAuth?.user?.id;
  const userName = sessionAuth?.user?.name || 'Aluno';

  // Fetch upcoming confirmed session
  let upcomingSession = null;
  let totalHours = 0;
  let scheduledCount = 0;
  let completedCount = 0;
  let learningGoals: string[] = [];

  if (userId) {
    upcomingSession = await prisma.session.findFirst({
      where: {
        studentId: userId,
        status: 'confirmed',
        scheduledEnd: { gt: new Date() }
      },
      orderBy: { scheduledStart: 'asc' },
      include: {
        tutor: { include: { user: true } },
        subject: true
      }
    });

    // Real stats
    const completedSessions = await prisma.session.findMany({
      where: { studentId: userId, status: 'completed' },
      select: { durationMinutes: true },
    });
    totalHours = Math.round(completedSessions.reduce((acc, s) => acc + s.durationMinutes, 0) / 60);
    completedCount = completedSessions.length;

    scheduledCount = await prisma.session.count({
      where: {
        studentId: userId,
        status: { in: ['confirmed', 'pending_confirmation'] },
        scheduledEnd: { gt: new Date() },
      },
    });

    // Fetch learning goals from student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId },
      select: { learningGoals: true },
    });
    if (studentProfile?.learningGoals) {
      try {
        const parsed = typeof studentProfile.learningGoals === 'string'
          ? JSON.parse(studentProfile.learningGoals)
          : studentProfile.learningGoals;
        if (Array.isArray(parsed)) learningGoals = parsed;
      } catch { /* ignore */ }
    }

    // Default goals if none set
    if (learningGoals.length === 0) {
      learningGoals = [
        'Aprender o básico de ChatGPT',
        'Construir um agente com LangChain',
        'Entender RAG Architecture',
      ];
    }
  }

  // If no upcoming session, fetch some suggestions
  let suggestedTutors: any[] = [];
  if (!upcomingSession) {
    suggestedTutors = await prisma.tutorProfile.findMany({
      where: { status: 'approved' },
      orderBy: { avgRating: 'desc' },
      take: 3,
      include: {
        user: { select: { fullName: true } },
        subjects: { include: { subject: { select: { name: true } } } },
      }
    });
  }

  // Fetch recent completed sessions
  const recentSessions = userId ? await prisma.session.findMany({
    where: { studentId: userId, status: 'completed' },
    orderBy: { scheduledStart: 'desc' },
    take: 5,
    include: {
      tutor: { include: { user: { select: { fullName: true } } } },
      subject: { select: { name: true } },
      review: { select: { id: true } }
    },
  }) : [];

  return (
    <div className={styles.dashboardContainer}>
      <WelcomeToast />
      {/* Welcome Header */}
      <div className={styles.welcomeHeader}>
        <div>
          <h1 className="heading-2">Olá, {userName.split(' ')[0]}! 👋</h1>
          <p className="text-muted">Pronto para dominar IA hoje?</p>
        </div>
        <Link href="/search" className="btn btn--primary">
          Encontrar Tutor
        </Link>
      </div>

      <div className={styles.grid}>
        {/* Main Column */}
        <div className={styles.mainCol}>
          {/* Next Class Card */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Próxima Aula</h2>
            
            {upcomingSession ? (
              <NextClassCard session={upcomingSession} />
            ) : (
              <div className={styles.card} style={{ background: 'var(--color-bg-subtle)' }}>
                <div className={styles.emptyState} style={{ padding: '24px 16px' }}>
                  <div className={styles.emptyIcon} style={{ background: '#fff', padding: '16px', borderRadius: '50%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <CalendarX size={40} strokeWidth={1.5} color="var(--color-primary)" />
                  </div>
                  <h3 style={{ marginTop: '16px', fontSize: '20px' }}>Nenhuma aula agendada</h3>
                  <p style={{ maxWidth: '400px', margin: '8px auto', color: 'var(--color-text-secondary)' }}>
                    Mantenha o ritmo de aprendizado! Que tal agendar uma aula com um de nossos tutores mais bem avaliados?
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', width: '100%', marginTop: '24px', textAlign: 'left' }}>
                    {suggestedTutors.map((tutor) => (
                      <div key={tutor.id} style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary-bg)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                            {tutor.user.fullName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)' }}>{tutor.user.fullName}</div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>★ {Number(tutor.avgRating).toFixed(1)}</div>
                          </div>
                        </div>
                        <Link href={`/tutor/${tutor.id}`} className="btn btn--secondary btn--sm" style={{ width: '100%', justifyContent: 'center' }}>
                          Ver Perfil
                        </Link>
                      </div>
                    ))}
                  </div>

                  <Link href="/search" className="btn btn--primary" style={{ marginTop: '24px' }}>
                    <Search size={16} /> Explorar Todos os Tutores
                  </Link>
                </div>
              </div>
            )}
          </section>

          {/* Recent Activity */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Atividade Recente</h2>
            <div className={styles.card}>
              {recentSessions.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}><History size={48} strokeWidth={1} /></div>
                  <h3>Nenhuma aula recente</h3>
                  <p>Você ainda não concluiu nenhuma aula. Que tal agendar sua primeira sessão?</p>
                  <Link href="/search" className="btn btn--secondary" style={{ marginTop: 'var(--space-4)' }}>
                    <Search size={16} /> Explorar Catálogo
                  </Link>
                </div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {recentSessions.map(s => (
                    <li key={s.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                      <div>
                        <strong>{s.subject.name}</strong>
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                          com {s.tutor.user.fullName} • {s.scheduledStart.toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      {s.review ? (
                        <span style={{ color: 'var(--color-success)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>Avaliada</span>
                      ) : (
                        <ReviewButton sessionId={s.id} />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Column */}
        <div className={styles.sideCol}>
          {/* Stats Card */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Seu Progresso</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <div className={styles.statValue}>{totalHours}h</div>
                <div className={styles.statLabel}>Aprendizado</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statValue}>{scheduledCount}</div>
                <div className={styles.statLabel}>Aulas Agendadas</div>
              </div>
            </div>
          </div>

          {/* Learning Goals */}
          <LearningGoals initialGoals={learningGoals} completedCount={completedCount} />
        </div>
      </div>
    </div>
  );
}
