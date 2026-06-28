import React from 'react';
import Link from 'next/link';
import prisma from '@ailearn/database';
import { auth } from '../../../auth';
import { Calendar, Play, Clock, Star, Video, XCircle } from 'lucide-react';
import { CancelButton, ReviewButton } from './SessionButtons';
import styles from './sessions.module.css';



export default async function SessionsPage({ searchParams }: { searchParams: { tab?: string } }) {
  const sessionAuth = await auth();
  if (!sessionAuth?.user) return null;

  const userId = sessionAuth.user.id;
  const isTutor = (sessionAuth.user as any).role === 'tutor';
  const tab = searchParams.tab || 'upcoming';

  // Find sessions
  const sessions = await prisma.session.findMany({
    where: {
      OR: [
        { studentId: userId },
        { tutor: { userId: userId } }
      ],
      ...(tab === 'upcoming' 
          ? { scheduledEnd: { gt: new Date() }, status: { in: ['confirmed', 'pending_confirmation'] } } 
          : { scheduledEnd: { lte: new Date() } }) // simplified past logic
    },
    orderBy: { scheduledStart: tab === 'upcoming' ? 'asc' : 'desc' },
    include: {
      student: { select: { fullName: true } },
      tutor: { include: { user: { select: { fullName: true } } } },
      subject: true,
    }
  });

  const formatStatus = (status: string) => {
    switch (status) {
      case 'confirmed': return <span className={`${styles.statusBadge} ${styles.statusConfirmed}`}>Confirmada</span>;
      case 'pending_confirmation': return <span className={`${styles.statusBadge} ${styles.statusPending}`}>Pendente</span>;
      case 'completed': return <span className={`${styles.statusBadge} ${styles.statusCompleted}`}>Concluída</span>;
      case 'cancelled_by_student':
      case 'cancelled_by_tutor': return <span className={`${styles.statusBadge} ${styles.statusCancelled}`}>Cancelada</span>;
      default: return <span className={`${styles.statusBadge} ${styles.statusPending}`}>{status}</span>;
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className="heading-2">Minhas Aulas</h1>
        <p>Gerencie seus agendamentos e acesse o histórico de aulas.</p>
      </div>

      <div className={styles.tabsContainer}>
        <Link href="?tab=upcoming" className={`${styles.tabBtn} ${tab === 'upcoming' ? styles.tabBtnActive : ''}`}>
          <Calendar size={18} /> Próximas Aulas
        </Link>
        <Link href="?tab=past" className={`${styles.tabBtn} ${tab === 'past' ? styles.tabBtnActive : ''}`}>
          <Clock size={18} /> Histórico
        </Link>
      </div>

      <div className={styles.sessionsList}>
        {sessions.length === 0 ? (
          <div className={styles.emptyState}>
            <Calendar size={48} className={styles.emptyIcon} style={{ margin: '0 auto' }} />
            <h3>Nenhuma aula encontrada</h3>
            <p>Você não possui aulas {tab === 'upcoming' ? 'agendadas para o futuro' : 'no seu histórico'}.</p>
          </div>
        ) : (
          sessions.map(session => {
            const isStudent = session.studentId === userId;
            const otherPersonName = isStudent ? session.tutor.user.fullName : session.student.fullName;
            const roleLabel = isStudent ? 'Tutor' : 'Aluno';
            const showEnterRoom = tab === 'upcoming' && session.status === 'confirmed';

            return (
              <div key={session.id} className={styles.sessionCard}>
                <div className={styles.sessionHeader}>
                  <div className={styles.sessionDateInfo}>
                    <Calendar size={16} />
                    <span>
                      {session.scheduledStart.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long' })}
                      {' • '}
                      {session.scheduledStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {formatStatus(session.status)}
                </div>

                <div className={styles.sessionBody}>
                  <div className={styles.avatar}>
                    {otherPersonName.substring(0, 2).toUpperCase()}
                  </div>
                  <div className={styles.details}>
                    <h3 className={styles.subjectName}>{session.subject.name}</h3>
                    <div className={styles.personName}>{roleLabel}: {otherPersonName}</div>
                  </div>
                  <div className={styles.actions}>
                    {showEnterRoom && (
                      <Link href={`/classroom/${session.id}`} className={`${styles.actionBtn} ${styles.btnPrimary}`}>
                        <Video size={16} /> Entrar na Sala
                      </Link>
                    )}
                    {!showEnterRoom && tab === 'upcoming' && (
                      <CancelButton sessionId={session.id} />
                    )}
                    {tab === 'past' && session.status === 'completed' && isStudent && (
                      <ReviewButton sessionId={session.id} />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
