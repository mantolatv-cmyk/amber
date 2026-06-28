import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Calendar, MessageSquare, Settings, LogOut, Bell, BookOpen } from 'lucide-react';
import { auth } from '../../auth';
import styles from './dashboard.module.css';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isTutor = session?.user?.role === 'tutor';
  const userName = session?.user?.name || '';
  const initials = userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

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
            <button className={styles.iconBtn}><Bell size={20} /></button>
            <div className={styles.userProfile}>
              <div className={styles.avatar}>
                {initials}
              </div>
            </div>
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
