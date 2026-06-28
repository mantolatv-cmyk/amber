'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import Header from '../components/Header/Header';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<'student' | 'tutor'>('student');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      toast.error('E-mail ou senha incorretos.');
      setIsLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <>
      <Header variant="light" navLinks={[]} showAuth={false} backLink={{ label: 'Voltar para Home', href: '/' }} />

      <main className={styles.authMain}>
        <div className={styles.authMesh} />
        
        <div className={styles.authContainer}>
          <div className={styles.authCard}>
            <div className={styles.authHeader}>
              <div className={styles.authLogo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              </div>
              <h1 className={styles.authTitle}>Bem-vindo de volta</h1>
              <p className={styles.authSubtitle}>Entre para continuar aprendendo ou ensinando na OpenLearn.</p>
            </div>



            <form onSubmit={handleLogin} className={styles.authForm}>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>E-mail</label>
                <input
                  type="email"
                  id="email"
                  className="input"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <div className={styles.labelRow}>
                  <label htmlFor="password" className={styles.label}>Senha</label>
                  <a href="#" className={styles.forgotPassword}>Esqueceu a senha?</a>
                </div>
                <input
                  type="password"
                  id="password"
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                className={`btn btn--primary ${styles.submitBtn}`}
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar na plataforma'}
              </button>
            </form>

            <div className={styles.authFooter}>
              <p>Ainda não tem conta? <a href="/register">Começar Grátis</a></p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
