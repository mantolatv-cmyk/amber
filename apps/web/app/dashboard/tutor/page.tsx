import React from 'react';
import Link from 'next/link';
import prisma from "@ailearn/database";
import { isDatabaseReachable } from "../../../lib/db-check";
import { auth } from "../../../auth";
import { redirect } from "next/navigation";
import { DollarSign, Users, Star, Clock, FileEdit, MessageSquare, ChevronRight, Play } from 'lucide-react';
import SessionActions from './SessionActions';
import styles from './tutor.module.css';

export default async function TutorDashboard() {
  const sessionAuth = await auth();
  if (!sessionAuth?.user) return null;

  if (sessionAuth.user.role !== 'tutor') {
    redirect('/dashboard/student');
  }

  const userId = sessionAuth.user.id;
  const userName = sessionAuth.user.name || 'Tutor';

  let tutorProfile: any = null;
  let unreadMessagesCount = 0;

  const dbOnline = await isDatabaseReachable();

  if (dbOnline) {
    try {
      const [profile, unread] = await Promise.all([
        prisma.tutorProfile.findUnique({
          where: { userId },
          include: {
            sessions: {
              include: {
                student: { select: { fullName: true, avatarUrl: true } },
                subject: { select: { name: true } },
              },
              orderBy: { scheduledStart: 'asc' },
            }
          }
        }),
        prisma.message.count({
          where: { receiverId: userId, isRead: false }
        })
      ]);
      tutorProfile = profile;
      unreadMessagesCount = unread;
    } catch (err) {
      console.warn("Database error in tutor dashboard, using fallback demo state:", err);
    }
  }

  if (!tutorProfile) {
    tutorProfile = {
      id: 'demo-tutor',
      userId,
      headline: 'Engenheiro de IA & Tutor Sênior',
      bio: 'Especialista em LLMs e RAG Architecture.',
      hourlyRateCents: 15000,
      currency: 'BRL',
      stripeAccountId: 'acct_demo123',
      stripeOnboarded: true,
      totalSessions: 42,
      avgRating: 4.95,
      sessions: [
        {
          id: 'demo-session-1',
          status: 'confirmed',
          priceCents: 15000,
          currency: 'BRL',
          durationMinutes: 60,
          scheduledStart: new Date(Date.now() + 3600000),
          scheduledEnd: new Date(Date.now() + 7200000),
          studentId: 'student-demo',
          student: { fullName: 'Lucas Dev', avatarUrl: null },
          subject: { name: 'LangChain & RAG' }
        }
      ]
    };
  }


  if (!tutorProfile) {
    return (
      <div className={styles.dashboardContainer}>
        <div className={styles.welcomeHeader}>
          <div>
            <h1 className="heading-2">Olá, {userName}!</h1>
            <p className="text-muted">Parece que seu perfil de tutor ainda não está configurado.</p>
          </div>
          <Link href="/onboarding/tutor" className="btn btn--primary">Completar Perfil</Link>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Ganhos do Mês (soma de aulas completed e confirmed no mês)
  const monthlyEarningsCents = (tutorProfile.sessions || [])
    .filter((s: any) => 
      (s.status === 'completed' || s.status === 'confirmed') && 
      new Date(s.scheduledStart) >= currentMonthStart
    )
    .reduce((acc: number, curr: any) => acc + curr.priceCents, 0);
  
  const formattedEarnings = (monthlyEarningsCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: tutorProfile.currency || 'BRL' });

  // Alunos Ativos (unique student IDs in last 3 months or all time)
  const uniqueStudents = new Set(
    (tutorProfile.sessions || [])
      .filter((s: any) => s.status === 'completed' || s.status === 'confirmed')
      .map((s: any) => s.studentId)
  );

  // Aulas Pendentes
  const pendingSessions = (tutorProfile.sessions || []).filter((s: any) => s.status === 'pending_confirmation' && new Date(s.scheduledEnd) > now);
  
  // Próximas Aulas (confirmadas e pendentes)
  const upcomingSessions = (tutorProfile.sessions || [])
    .filter((s: any) => (s.status === 'confirmed' || s.status === 'pending_confirmation') && new Date(s.scheduledEnd) > now)
    .slice(0, 3);


  return (
    <div className={styles.dashboardContainer}>
      {/* Welcome Header */}
      <div className={styles.welcomeHeader}>
        <div>
          <h1 className="heading-2">Olá, {userName.split(' ')[0]}! <Star size={28} color="var(--color-warning)" fill="currentColor" style={{display: 'inline-block', verticalAlign: 'text-bottom'}} /></h1>
          <p className="text-muted">Aqui está o resumo do seu impacto nesta semana.</p>
        </div>
        <div className={styles.headerActions}>
          <button className="btn btn--secondary">Editar Perfil</button>
          <Link href="/dashboard/tutor/schedule" className="btn btn--primary">Gerenciar Horários</Link>
        </div>
      </div>

      {!tutorProfile.stripeAccountId && (
        <div style={{ background: 'var(--color-warning-bg)', border: '1px solid #FFD54F', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', color: '#B8860B' }}>Complete seu cadastro financeiro</h3>
            <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Você precisa conectar uma conta Stripe para receber pelas suas aulas.</p>
          </div>
          <Link href="/dashboard/tutor/stripe" className="btn btn--primary" style={{ background: '#B8860B', borderColor: '#B8860B' }}>Conectar Stripe</Link>
        </div>
      )}

      {/* Financial Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}><DollarSign size={24} /></div>
          <div>
            <div className={styles.statLabel}>Ganhos do Mês</div>
            <div className={styles.statValue}>{formattedEarnings}</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)' }}><Users size={24} /></div>
          <div>
            <div className={styles.statLabel}>Alunos Ativos</div>
            <div className={styles.statValue}>{uniqueStudents.size}</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(108, 92, 231, 0.1)', color: 'var(--color-primary)' }}><Star size={24} /></div>
          <div>
            <div className={styles.statLabel}>Avaliação Média</div>
            <div className={styles.statValue}>{tutorProfile.avgRating.toString()}</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'var(--color-warning-bg)', color: '#B8860B' }}><Clock size={24} /></div>
          <div>
            <div className={styles.statLabel}>Aulas Pendentes</div>
            <div className={styles.statValue}>{pendingSessions.length}</div>
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Main Column */}
        <div className={styles.mainCol}>
          {/* Upcoming Sessions */}
          <section className={styles.section}>
            <div className={styles.sectionHeaderFlex}>
              <h2 className={styles.sectionTitle}>Próximas Aulas</h2>
              <Link href="/dashboard/sessions" className={styles.viewAllLink}>Ver agenda completa <ChevronRight size={16} /></Link>
            </div>
            
            <div className={styles.sessionList}>
              {upcomingSessions.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                  <p style={{ color: 'var(--color-text-secondary)' }}>Você não tem próximas aulas agendadas.</p>
                </div>
              ) : (
                upcomingSessions.map((session: any) => {
                  const isPending = session.status === 'pending_confirmation';
                  const startDate = new Date(session.scheduledStart);
                  const dateStr = startDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });
                  
                  return (
                    <div key={session.id} className={`${styles.card} ${styles.sessionCard}`}>
                      <div className={styles.sessionTimeCol}>
                        <div className={styles.timeStr}>{startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className={styles.durationStr}>{dateStr}</div>
                      </div>

                      <div className={styles.sessionDetails}>
                        <div className={styles.studentInfo}>
                          <div className={styles.studentAvatar} style={{ background: isPending ? 'var(--color-info-bg)' : 'var(--color-primary-50)', color: isPending ? 'var(--color-info)' : 'var(--color-primary-light)' }}>
                            {session.student.fullName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className={styles.studentName}>{session.student.fullName}</h3>
                            <p className={styles.subjectName}>{session.subject.name} {session.isTrial ? '(Aula Experimental)' : ''}</p>
                          </div>
                        </div>
                        {isPending ? (
                          <span className={`${styles.statusBadge} ${styles.statusPending}`}>A Confirmar</span>
                        ) : (
                          <span className={`${styles.statusBadge}`}>Confirmada</span>
                        )}
                      </div>
                      <div className={styles.sessionActions}>
                        {isPending ? (
                          <SessionActions sessionId={session.id} />
                        ) : (
                          <Link href={`/classroom/${session.id}`} className="btn btn--accent" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <Play size={16} fill="currentColor" /> Iniciar Aula
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Column */}
        <div className={styles.sideCol}>
          {/* Quick Actions */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Tarefas Rápidas</h3>
            <ul className={styles.taskList}>
              <li className={styles.taskItem}>
                <div className={styles.taskIcon}><FileEdit size={20} /></div>
                <div className={styles.taskText}>
                  <strong>Avaliações Pendentes</strong>
                  <span>Você tem avaliações pendentes.</span>
                </div>
              </li>
              <li className={styles.taskItem}>
                <div className={styles.taskIcon}><MessageSquare size={20} /></div>
                <div className={styles.taskText}>
                  <strong>Mensagens Novas</strong>
                  <span>Você tem {unreadMessagesCount} mensagem não lida.</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Wallet Preview */}
          <div className={styles.card} style={{ marginTop: 'var(--space-6)' }}>
            <div className={styles.cardHeaderFlex}>
              <h3 className={styles.cardTitle}>Carteira</h3>
              <button className={styles.textBtn}>Ver Extrato</button>
            </div>
            <div className={styles.walletBox}>
              <div className={styles.walletLabel}>Disponível para saque</div>
              <div className={styles.walletAmount}>{formattedEarnings}</div>
              <button className={`btn btn--primary ${styles.withdrawBtn}`}>Sacar agora</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
