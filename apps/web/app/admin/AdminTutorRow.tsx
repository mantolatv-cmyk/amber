'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { approveTutorAction, rejectTutorAction, suspendTutorAction } from './actions';
import { Loader2, Check, X, ShieldAlert } from 'lucide-react';
import styles from './admin.module.css';

interface AdminTutorRowProps {
  tutor: {
    id: string;
    headline: string;
    hourlyRateCents: number;
    trialRateCents: number | null;
    status: string;
    createdAt: Date;
    user: {
      fullName: string;
      email: string;
    };
  };
}

export default function AdminTutorRow({ tutor }: AdminTutorRowProps) {
  const [loading, setLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(tutor.status);

  const handleApprove = async () => {
    setLoading(true);
    const res = await approveTutorAction(tutor.id);
    if (res.success) {
      toast.success(`Tutor ${tutor.user.fullName} aprovado!`);
      setCurrentStatus('approved');
    } else {
      toast.error(res.error || 'Erro ao aprovar.');
    }
    setLoading(false);
  };

  const handleReject = async () => {
    setLoading(true);
    const res = await rejectTutorAction(tutor.id);
    if (res.success) {
      toast.success(`Tutor ${tutor.user.fullName} rejeitado.`);
      setCurrentStatus('rejected');
    } else {
      toast.error(res.error || 'Erro ao rejeitar.');
    }
    setLoading(false);
  };

  const handleSuspend = async () => {
    setLoading(true);
    const res = await suspendTutorAction(tutor.id);
    if (res.success) {
      toast.success(`Tutor ${tutor.user.fullName} suspenso.`);
      setCurrentStatus('suspended');
    } else {
      toast.error(res.error || 'Erro ao suspender.');
    }
    setLoading(false);
  };

  const getBadgeClass = (st: string) => {
    switch (st) {
      case 'approved': return styles.statusApproved;
      case 'pending_review': return styles.statusPending;
      case 'suspended': return styles.statusSuspended;
      default: return styles.statusRejected;
    }
  };

  const getStatusLabel = (st: string) => {
    switch (st) {
      case 'approved': return 'Aprovado';
      case 'pending_review': return 'Em Análise';
      case 'suspended': return 'Suspenso';
      default: return 'Rejeitado';
    }
  };

  return (
    <tr>
      <td>
        <div style={{ fontWeight: 600 }}>{tutor.user.fullName}</div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{tutor.user.email}</div>
      </td>
      <td style={{ maxWidth: '280px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
        {tutor.headline}
      </td>
      <td>
        <strong>R$ {(tutor.hourlyRateCents / 100).toFixed(0)}/h</strong>
        {tutor.trialRateCents && (
          <div style={{ fontSize: '11px', color: 'var(--color-primary)' }}>
            Exp: R$ {(tutor.trialRateCents / 100).toFixed(0)}
          </div>
        )}
      </td>
      <td>
        <span className={`${styles.statusBadge} ${getBadgeClass(currentStatus)}`}>
          {getStatusLabel(currentStatus)}
        </span>
      </td>
      <td>
        <div className={styles.actionBtnGroup}>
          {loading ? (
            <Loader2 size={16} className="spin" />
          ) : (
            <>
              {currentStatus !== 'approved' && (
                <button onClick={handleApprove} className={styles.btnApprove} title="Aprovar Perfil">
                  <Check size={14} style={{ display: 'inline', marginRight: 4 }} /> Aprovar
                </button>
              )}
              {currentStatus !== 'rejected' && currentStatus !== 'approved' && (
                <button onClick={handleReject} className={styles.btnReject} title="Rejeitar Perfil">
                  <X size={14} style={{ display: 'inline', marginRight: 4 }} /> Rejeitar
                </button>
              )}
              {currentStatus === 'approved' && (
                <button onClick={handleSuspend} className={styles.btnActionOutline} title="Suspender">
                  Suspender
                </button>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
