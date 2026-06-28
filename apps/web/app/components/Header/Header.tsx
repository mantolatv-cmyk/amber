'use client';

import { useSession, signOut } from 'next-auth/react';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';
import styles from './Header.module.css';

interface NavLink {
  label: string;
  href: string;
}

interface HeaderProps {
  /** 'light' for white bg, 'dark' for transparent dark bg */
  variant?: 'light' | 'dark';
  /** Optional nav links to show */
  navLinks?: NavLink[];
  /** Optional back link text and href */
  backLink?: { label: string; href: string };
  /** Whether to show auth action buttons */
  showAuth?: boolean;
}

const DEFAULT_NAV_LINKS: NavLink[] = [
  { label: 'Matérias', href: '/#subjects' },
  { label: 'Tutores', href: '/search' },
  { label: 'Como Funciona', href: '/#how-it-works' },
  { label: 'Para Empresas', href: '/enterprise' },
];

export default function Header({
  variant = 'light',
  navLinks = DEFAULT_NAV_LINKS,
  backLink,
  showAuth = true,
}: HeaderProps) {
  const { data: session, status } = useSession();
  const isDark = variant === 'dark';

  return (
    <header
      className={`${styles.header} ${isDark ? styles.headerDark : styles.headerLight}`}
      id="header"
    >
      <div className={styles.headerInner}>
        {/* Logo */}
        <a
          href="/"
          className={`${styles.logo} ${isDark ? styles.logoDark : styles.logoLight}`}
          id="logo"
        >
          <span className={styles.logoIcon}>
            <BookOpen size={20} strokeWidth={2.5} />
          </span>
          <span>
            Open
            <span className={isDark ? styles.logoAccentDark : styles.logoAccentLight}>
              Learn
            </span>
          </span>
        </a>

        {/* Navigation */}
        <nav className={styles.nav}>
          {navLinks.length > 0 && (
            <ul className={styles.navLinks}>
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className={`${styles.navLink} ${isDark ? styles.navLinkDark : styles.navLinkLight}`}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          )}

          <div className={styles.navActions}>
            {backLink && (
              <a
                href={backLink.href}
                className={`${styles.backLink} ${isDark ? styles.backLinkDark : styles.backLinkLight}`}
              >
                ← {backLink.label}
              </a>
            )}

            {showAuth && (
              <>
                {status === 'loading' ? (
                  <span className="btn btn--ghost" style={isDark ? { color: 'rgba(255,255,255,0.8)' } : undefined}>...</span>
                ) : session?.user ? (
                  <>
                    <Link href="/dashboard" className="btn btn--ghost" style={isDark ? { color: 'rgba(255,255,255,0.8)' } : undefined}>
                      Painel ({session.user.name?.split(' ')[0]})
                    </Link>
                    <button onClick={() => signOut({ callbackUrl: '/' })} className="btn btn--primary">
                      Sair
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="btn btn--ghost"
                      id="login-btn"
                      style={isDark ? { color: 'rgba(255,255,255,0.8)' } : undefined}
                    >
                      Entrar
                    </Link>
                    <Link href="/register" className="btn btn--primary" id="register-btn">
                      Começar Grátis
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`${styles.mobileMenuBtn} ${isDark ? styles.mobileMenuBtnDark : styles.mobileMenuBtnLight}`}
            aria-label="Abrir menu"
            id="mobile-menu-btn"
          >
            <div className={styles.hamburger}>
              <span className={`${styles.hamburgerLine} ${isDark ? styles.hamburgerLineDark : styles.hamburgerLineLight}`} />
              <span className={`${styles.hamburgerLine} ${isDark ? styles.hamburgerLineDark : styles.hamburgerLineLight}`} />
              <span className={`${styles.hamburgerLine} ${isDark ? styles.hamburgerLineDark : styles.hamburgerLineLight}`} />
            </div>
          </button>
        </nav>
      </div>
    </header>
  );
}
