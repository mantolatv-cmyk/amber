import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Calendar, MessageSquare, Settings, LogOut, Bell, BookOpen, ShieldCheck } from 'lucide-react';
import { auth } from '../../auth';
import prisma from '@ailearn/database';
import { isDatabaseReachable } from '../../lib/db-check';
import ThemeToggle from '../components/ThemeToggle/ThemeToggle';
import styles from './dashboard.module.css';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isTutor = session?.user?.role === 'tutor';
  const isAdmin = (session?.user as any)?.role === 'admin';
  const userName = session?.user?.name || '';
  const initials = userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

  let unreadCount = 0;
  const dbOnline = await isDatabaseReachable();
  if (dbOnline && session?.user?.id) {
    try {
      unreadCount = await prisma.notification.count({ where: { userId: session.user.id, isRead: false } });
    } catch {
      unreadCount = 0;
    }
  }


  return (
    <div className={styles.dashboardWrapper}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}><BookOpen size={18} strokeWidth={2.5} /></span>
            <span>OpenLearn</span>
          </Link>
        </div>

        <nav className={styles.sidebarNav}>
          <div className={styles.navSection}>
            <span className={styles.navLabel}>Menu Principal</span>
            <Link href={isTutor ? "/dashboard/tutor" : "/dashboard/student"} className={`${styles.navItem} ${styles.navItemActive}`}>
              <span className={styles.navIcon}><LayoutDashboard size={20} /></span>
              Visão Geral
            </Link>
            <Link href="/dashboard/sessions" className={styles.navItem}>
              <span className={styles.navIcon}><Calendar size={20} /></span>
              Minhas Aulas
            </Link>
            <Link href="/dashboard/messages" className={styles.navItem}>
              <span className={styles.navIcon}><MessageSquare size={20} /></span>
              Mensagens
            </Link>
          </div>

          {isAdmin && (
            <div className={styles.navSection}>
              <span className={styles.navLabel}>Gestão</span>
              <Link href="/admin" className={styles.navItem} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                <span className={styles.navIcon}><ShieldCheck size={20} /></span>
                Painel Admin
              </Link>
            </div>
          )}

          <div className={styles.navSection}>
            <span className={styles.navLabel}>Conta</span>
            <Link href="/dashboard/settings" className={styles.navItem}>
              <span className={styles.navIcon}><Settings size={20} /></span>
              Configurações
            </Link>
            <a href="/api/auth/signout" className={styles.navItem}>
              <span className={styles.navIcon}><LogOut size={20} /></span>
              Sair
            </a>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        {/* Top Navbar */}
        <header className={styles.topNav}>
          <div className={styles.topNavSearch}>
            <input type="text" placeholder="Buscar aulas, tutores..." className={styles.searchInput} />
          </div>
          <div className={styles.topNavActions}>
            <ThemeToggle />
            <Link href="/dashboard/notifications" className={styles.iconBtn} style={{ position: 'relative' }}>
              <Bell size={20} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  boxShadow: '0 0 6px rgba(239, 68, 68, 0.7)'
                }} />
              )}
            </Link>
            <Link href="/dashboard/settings" className={styles.userProfile}>
              <div className={styles.avatar}>
                {initials}
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className={styles.pageContent}>
          {children}
        </main>
      </div>
    </div>
  );
}
