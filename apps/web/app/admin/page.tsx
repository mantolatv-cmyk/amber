import React from 'react';
import prisma from '@ailearn/database';
import { Users, DollarSign, Clock, AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import AdminTutorRow from './AdminTutorRow';
import styles from './admin.module.css';

export default async function AdminOverviewPage() {
  const [
    totalStudents,
    totalTutors,
    pendingTutorsCount,
    disputedSessionsCount,
    paymentsAggregate,
    pendingTutors,
  ] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.tutorProfile.count(),
    prisma.tutorProfile.count({ where: { status: 'pending_review' } }),
    prisma.session.count({ where: { status: 'disputed' } }),
    prisma.payment.aggregate({
      _sum: {
        amountCents: true,
        platformFeeCents: true,
      },
    }),
    prisma.tutorProfile.findMany({
      where: { status: 'pending_review' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true, email: true } },
      },
    }),
  ]);

  const totalGMVCents = paymentsAggregate._sum.amountCents || 0;
  const platformRevenueCents = paymentsAggregate._sum.platformFeeCents || 0;

  return (
    <div>
      {/* Metrics Grid */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Total de Alunos</span>
            <Users size={18} color="var(--color-primary)" />
          </div>
          <div className={styles.metricValue}>{totalStudents}</div>
          <div className={styles.metricSubtext}>Cadastrados na plataforma</div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Total de Tutores</span>
            <ShieldCheck size={18} color="#10b981" />
          </div>
          <div className={styles.metricValue}>{totalTutors}</div>
          <div className={styles.metricSubtext}>
            {pendingTutorsCount} aguardando aprovação
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Volume Transacionado (GMV)</span>
            <DollarSign size={18} color="#3b82f6" />
          </div>
          <div className={styles.metricValue}>
            R$ {(totalGMVCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className={styles.metricSubtext}>Total bruto pago por alunos</div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Receita da Plataforma</span>
            <DollarSign size={18} color="#8b5cf6" />
          </div>
          <div className={styles.metricValue} style={{ color: '#8b5cf6' }}>
            R$ {(platformRevenueCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className={styles.metricSubtext}>Comissões retidas</div>
        </div>
      </div>

      {disputedSessionsCount > 0 && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#991b1b' }}>
            <AlertTriangle size={24} color="#dc2626" />
            <div>
              <strong>Atenção: Existem {disputedSessionsCount} aulas em disputa!</strong>
              <div style={{ fontSize: '13px', color: '#b91c1c' }}>
                Alunos ou tutores contestaram a realização de aulas. É necessária mediação da equipe.
              </div>
            </div>
          </div>
          <Link href="/admin/sessions" className="btn btn--primary" style={{ background: '#dc2626', borderColor: '#dc2626', fontSize: '13px' }}>
            Resolver Disputas
          </Link>
        </div>
      )}

      {/* Pending Tutors Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Fila de Moderação de Tutores ({pendingTutorsCount})</h2>
          <Link href="/admin/tutors" style={{ fontSize: '13px', color: 'var(--color-primary)', fontWeight: 600 }}>
            Ver todos os tutores →
          </Link>
        </div>

        {pendingTutors.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <CheckCircle size={36} color="#10b981" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontWeight: 600 }}>Nenhum tutor aguardando moderação no momento!</p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Todos os novos perfis foram revisados.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tutor</th>
                <th>Título / Headline</th>
                <th>Preço / Hora</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pendingTutors.map((tutor) => (
                <AdminTutorRow key={tutor.id} tutor={tutor as any} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
