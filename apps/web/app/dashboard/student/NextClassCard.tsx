'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Calendar, Clock, AlertCircle } from 'lucide-react';
import styles from './student.module.css';

interface NextClassCardProps {
  session: {
    id: string;
    scheduledStart: Date;
    scheduledEnd: Date;
    subject: { name: string };
    tutor: { user: { fullName: string } };
  };
}

export default function NextClassCard({ session }: NextClassCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isJoinable, setIsJoinable] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      // Ensure we treat the date string from server correctly if passed as string
      const startTime = new Date(session.scheduledStart);
      const diffMs = startTime.getTime() - now.getTime();
      
      // Allow joining 15 minutes before the class
      if (diffMs <= 15 * 60 * 1000) {
        setIsJoinable(true);
        if (diffMs <= 0) {
          setTimeRemaining('A aula já começou!');
        } else {
          setTimeRemaining('A sala de aula está aberta!');
        }
        return;
      }

      setIsJoinable(false);

      // Format time remaining
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`Faltam ${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeRemaining(`Faltam ${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`Faltam ${minutes}m`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // update every minute
    return () => clearInterval(interval);
  }, [session.scheduledStart]);

  const startDate = new Date(session.scheduledStart);

  return (
    <div className={`${styles.card} ${styles.nextClassCard}`} style={{ position: 'relative', overflow: 'hidden' }}>
      <div className={styles.nextClassHeader}>
        <div className={styles.nextClassTime}>
          <span className={styles.timeLabel}>
            <Calendar size={16} /> {startDate.toLocaleDateString('pt-BR')} às {startDate.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
          </span>
          <span className={styles.statusBadge}>Confirmada</span>
        </div>
      </div>
      
      <div className={styles.tutorInfo} style={{ marginBottom: '24px' }}>
        <div className={styles.tutorAvatar}>
          {session.tutor.user.fullName.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <h3 className={styles.tutorName}>{session.tutor.user.fullName}</h3>
          <p className={styles.subjectName}>{session.subject.name}</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', background: 'var(--color-bg-subtle)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isJoinable ? 'var(--color-success)' : 'var(--color-text-secondary)', fontWeight: 500 }}>
          {isJoinable ? <AlertCircle size={20} /> : <Clock size={20} />}
          <span>{timeRemaining}</span>
        </div>

        {isJoinable ? (
          <Link href={`/classroom/${session.id}`} className="btn btn--primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center', maxWidth: '250px' }}>
            <Play size={16} fill="currentColor" /> Entrar na Sala
          </Link>
        ) : (
          <button className="btn btn--primary" disabled style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center', maxWidth: '250px', opacity: 0.6, cursor: 'not-allowed' }}>
            <Play size={16} fill="currentColor" /> Entrar na Sala
          </button>
        )}
      </div>
    </div>
  );
}
