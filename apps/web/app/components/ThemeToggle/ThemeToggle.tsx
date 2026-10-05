'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const currentTheme = (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 
      (localStorage.getItem('openlearn-theme') as 'light' | 'dark') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    setTheme(currentTheme);
    document.documentElement.setAttribute('data-theme', currentTheme);

    const handleThemeChange = (e: any) => {
      if (e.detail?.theme) {
        setTheme(e.detail.theme);
      }
    };

    window.addEventListener('openlearn-theme-change', handleThemeChange);
    return () => window.removeEventListener('openlearn-theme-change', handleThemeChange);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('openlearn-theme', nextTheme);
    window.dispatchEvent(new CustomEvent('openlearn-theme-change', { detail: { theme: nextTheme } }));
  };

  if (!mounted) {
    return (
      <button 
        type="button" 
        className={`${styles.themeBtn} ${className || ''}`}
        aria-label="Alternar tema"
        disabled
      >
        <span style={{ width: 18, height: 18 }} />
      </button>
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={`${styles.themeBtn} ${className || ''}`}
      onClick={toggleTheme}
      title={isDark ? "Alternar para Modo Claro" : "Alternar para Modo Escuro (AI Developer)"}
      aria-label="Alternar tema claro/escuro"
    >
      <div className={styles.iconWrap}>
        {isDark ? (
          <Sun size={18} className={styles.sunIcon} />
        ) : (
          <Moon size={18} className={styles.moonIcon} />
        )}
      </div>
    </button>
  );
}
