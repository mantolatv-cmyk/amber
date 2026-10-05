import React from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import prisma from '@ailearn/database';
import { isDatabaseReachable } from '../../../lib/db-check';
import { auth } from '../../../auth';
import { redirect } from 'next/navigation';

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  let notifications: any[] = [];
  const dbOnline = await isDatabaseReachable();

  if (dbOnline) {
    try {
      notifications = await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      if (notifications.some(n => !n.isRead)) {
        await prisma.notification.updateMany({
          where: { userId: session.user.id, isRead: false },
          data: { isRead: true }
        });
      }
    } catch (err) {
      console.warn("Database error loading notifications:", err);
    }
  }

  if (notifications.length === 0) {
    notifications = [
      {
        id: 'demo-notif-1',
        title: 'Aula Confirmada com Sucesso!',
        body: 'Sua aula de "LangChain & RAG Avançado" está agendada para hoje às 14:00.',
        isRead: false,
        createdAt: new Date(),
      },
      {
        id: 'demo-notif-2',
        title: 'Bem-vindo(a) à OpenLearn',
        body: 'Explore tutores de ponta em IA, Engenharia de Prompts e Machine Learning.',
        isRead: true,
        createdAt: new Date(Date.now() - 86400000),
      }
    ];
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="heading-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <Bell size={28} /> Notificações
      </h1>
      
      {notifications.length === 0 ? (
        <div style={{ background: 'var(--color-surface)', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '48px', textAlign: 'center' }}>
          <div style={{ color: 'var(--color-text-muted)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
            <Bell size={48} style={{ opacity: 0.5 }} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Nenhuma notificação nova</h3>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px' }}>
            Você está atualizado! Nós te avisaremos quando algo importante acontecer.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map(n => (
            <div key={n.id} style={{ 
              background: n.isRead ? 'var(--color-surface)' : 'var(--color-primary-50)', 
              borderRadius: '12px', 
              border: '1px solid',
              borderColor: n.isRead ? 'var(--color-border)' : 'var(--color-primary-200)',
              padding: '16px',
              display: 'flex',
              gap: '16px'
            }}>
              <div style={{ marginTop: '4px', color: n.isRead ? 'var(--color-text-muted)' : 'var(--color-primary)' }}>
                {n.isRead ? <CheckCircle size={24} /> : <Bell size={24} />}
              </div>
              <div>
                <h4 style={{ fontWeight: 600, fontSize: '16px', marginBottom: '4px', color: 'var(--color-text)' }}>{n.title}</h4>
                {n.body && <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '8px' }}>{n.body}</p>}
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  {n.createdAt.toLocaleString('pt-BR')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
