import React from 'react';
import prisma from '@ailearn/database';
import Link from 'next/link';
import AdminSessionRow from './AdminSessionRow';
import styles from '../admin.module.css';

export default async function AdminSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;

  const whereClause: any = {};
  if (filter === 'disputed') {
    whereClause.status = 'disputed';
  } else if (filter === 'active') {
    whereClause.status = { in: ['confirmed', 'in_progress'] };
  } else if (filter === 'completed') {
    whereClause.status = 'completed';
  }

  const sessions = await prisma.session.findMany({
    where: whereClause,
    orderBy: { scheduledStart: 'desc' },
    include: {
      student: { select: { fullName: true, email: true } },
      tutor: { include: { user: { select: { fullName: true, email: true } } } },
      payment: { select: { status: true, amountCents: true } },
    },
    take: 50,
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="heading-3">Monitoramento de Aulas e Mediação de Disputas</h2>
          <p className="text-muted">Acompanhe sessões ativas e resolva impasses entre alunos e tutores.</p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { label: 'Todas', value: undefined },
            { label: 'Em Disputa', value: 'disputed' },
            { label: 'Ativas', value: 'active' },
            { label: 'Concluídas', value: 'completed' },
          ].map((f) => {
            const isActive = filter === f.value;
            return (
              <Link
                key={f.label}
                href={f.value ? `/admin/sessions?filter=${f.value}` : '/admin/sessions'}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  background: isActive ? '#6c5ce7' : 'var(--color-surface)',
                  color: isActive ? '#fff' : 'var(--color-text-secondary)',
                  border: '1px solid',
                  borderColor: isActive ? '#6c5ce7' : 'var(--color-border)',
                }}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Aula / Horário</th>
              <th>Aluno</th>
              <th>Tutor</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Ações / Sala</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
                  Nenhuma aula encontrada com o filtro selecionado.
                </td>
              </tr>
            ) : (
              sessions.map((s) => (
                <AdminSessionRow key={s.id} session={s as any} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
