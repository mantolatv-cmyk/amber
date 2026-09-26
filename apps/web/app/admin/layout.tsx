import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '../../auth';
import { LayoutDashboard, Users, Calendar, ArrowLeft, ShieldAlert, BookOpen } from 'lucide-react';
import styles from './admin.module.css';

export const metadata = {
  title: 'Painel Administrativo | OpenLearn',
  description: 'Gestão operacional, moderação de tutores e mediação de disputas.',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/admin');
  }

  if ((session.user as any).role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className={styles.adminWrapper}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={20} color="#6c5ce7" />
            <span className={styles.logoText}>OpenLearn</span>
          </div>
          <span className={styles.adminBadge}>Admin</span>
        </div>

        <nav className={styles.sidebarNav}>
          <Link href="/admin" className={styles.navItem}>
            <LayoutDashboard size={18} />
            Visão Geral
          </Link>
          <Link href="/admin/tutors" className={styles.navItem}>
            <Users size={18} />
            Moderação de Tutores
          </Link>
          <Link href="/admin/sessions" className={styles.navItem}>
            <Calendar size={18} />
            Aulas & Disputas
          </Link>
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/dashboard" className={styles.backToAppBtn}>
            <ArrowLeft size={16} /> Voltar ao Painel
          </Link>
        </div>
      </aside>

      {/* Main Area */}
      <div className={styles.mainArea}>
        <header className={styles.topBar}>
          <h1 className={styles.pageTitle}>Administração da Plataforma</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Logado como:</span>
            <strong>{session.user.name}</strong>
          </div>
        </header>

        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
