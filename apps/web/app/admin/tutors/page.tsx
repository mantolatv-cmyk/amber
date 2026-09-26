import React from 'react';
import prisma from '@ailearn/database';
import Link from 'next/link';
import AdminTutorRow from '../AdminTutorRow';
import styles from '../admin.module.css';

export default async function AdminTutorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const whereClause: any = {};
  if (status && ['pending_review', 'approved', 'suspended', 'rejected'].includes(status)) {
    whereClause.status = status;
  }

  const tutors = await prisma.tutorProfile.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { fullName: true, email: true } },
    },
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 className="heading-3">Gestão e Moderação de Tutores</h2>
          <p className="text-muted">Aprove, rejeite ou suspenda contas de professores na plataforma.</p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { label: 'Todos', value: undefined },
            { label: 'Pendentes', value: 'pending_review' },
            { label: 'Aprovados', value: 'approved' },
            { label: 'Suspensos', value: 'suspended' },
          ].map((f) => {
            const isActive = status === f.value;
            return (
              <Link
                key={f.label}
                href={f.value ? `/admin/tutors?status=${f.value}` : '/admin/tutors'}
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
              <th>Tutor</th>
              <th>Título / Headline</th>
              <th>Preço / Hora</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {tutors.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
                  Nenhum tutor encontrado com o filtro selecionado.
                </td>
              </tr>
            ) : (
              tutors.map((t) => (
                <AdminTutorRow key={t.id} tutor={t as any} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
