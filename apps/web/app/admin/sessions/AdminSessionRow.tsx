'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { resolveDisputeAction } from '../actions';
import { Loader2, Video, CheckCircle, RefreshCcw, AlertCircle } from 'lucide-react';
import styles from '../admin.module.css';

interface AdminSessionRowProps {
  session: {
    id: string;
    scheduledStart: Date;
    durationMinutes: number;
    priceCents: number;
    status: string;
    dailyRoomUrl: string | null;
    student: {
      fullName: string;
      email: string;
    };
    tutor: {
      user: {
        fullName: string;
        email: string;
      };
    };
    payment: {
      status: string;
      amountCents: number;
    } | null;
  };
}

export default function AdminSessionRow({ session }: AdminSessionRowProps) {
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(session.status);

  const handleResolve = async (resolution: 'tutor' | 'student') => {
    setLoading(true);
    const res = await resolveDisputeAction(session.id, resolution);
    if (res.success) {
      if (resolution === 'tutor') {
        toast.success('Disputa resolvida: pagamento liberado para o tutor!');
        setCurrentStatus('completed');
      } else {
        toast.success('Disputa resolvida: reembolso emitido para o aluno!');
        setCurrentStatus('cancelled_by_student');
      }
    } else {
      toast.error(res.error || 'Erro ao resolver disputa.');
    }
    setLoading(false);
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'confirmed':
        return <span className={`${styles.statusBadge} ${styles.statusApproved}`}>Confirmada</span>;
      case 'completed':
        return <span className={`${styles.statusBadge} ${styles.statusApproved}`}>Concluída</span>;
      case 'in_progress':
        return <span className={`${styles.statusBadge} ${styles.statusPending}`}>Em Andamento</span>;
      case 'disputed':
        return (
          <span className={`${styles.statusBadge} ${styles.statusSuspended}`} style={{ background: '#fee2e2', color: '#b91c1c' }}>
            <AlertCircle size={12} /> Em Disputa
          </span>
        );
      case 'cancelled_by_student':
      case 'cancelled_by_tutor':
        return <span className={`${styles.statusBadge} ${styles.statusRejected}`}>Cancelada</span>;
      default:
        return <span className={`${styles.statusBadge} ${styles.statusPending}`}>{st}</span>;
    }
  };

  return (
    <tr>
      <td>
        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-text-muted)' }}>
          #{session.id.substring(0, 8)}
        </span>
        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
          {new Date(session.scheduledStart).toLocaleString('pt-BR')} ({session.durationMinutes} min)
        </div>
      </td>
      <td>
        <div style={{ fontWeight: 600 }}>{session.student.fullName}</div>
        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{session.student.email}</div>
      </td>
      <td>
        <div style={{ fontWeight: 600 }}>{session.tutor.user.fullName}</div>
        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{session.tutor.user.email}</div>
      </td>
      <td>
        <strong>R$ {(session.priceCents / 100).toFixed(2)}</strong>
        {session.payment && (
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Status: {session.payment.status}
          </div>
        )}
      </td>
      <td>{getStatusBadge(currentStatus)}</td>
      <td>
        {currentStatus === 'disputed' ? (
          <div className={styles.actionBtnGroup}>
            {loading ? (
              <Loader2 size={16} className="spin" />
            ) : (
              <>
                <button
                  onClick={() => handleResolve('tutor')}
                  className={styles.btnApprove}
                  title="Pagar Tutor"
                >
                  Pagar Tutor
                </button>
                <button
                  onClick={() => handleResolve('student')}
                  className={styles.btnReject}
                  title="Reembolsar Aluno"
                >
                  Reembolsar Aluno
                </button>
              </>
            )}
          </div>
        ) : session.dailyRoomUrl ? (
          <a
            href={session.dailyRoomUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.btnActionOutline}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
          >
            <Video size={13} /> Sala Daily
          </a>
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>—</span>
        )}
      </td>
    </tr>
  );
}
