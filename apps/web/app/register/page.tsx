'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { registerUser } from '../actions/auth';
import Header from '../components/Header/Header';
// Reusing login styles since the layout is identical
import styles from '../login/login.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'tutor'>('student');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('role', role);

    const result = await registerUser(formData);

    if (result?.error) {
      toast.error(result.error);
      setIsLoading(false);
      return;
    }

    const signInResult = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (signInResult?.error) {
      toast.error('Conta criada, mas falha no login.');
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
              <h1 className={styles.authTitle}>Crie sua conta</h1>
              <p className={styles.authSubtitle}>Junte-se a milhares de alunos e tutores na OpenLearn.</p>
            </div>

            <form onSubmit={handleRegister} className={styles.authForm}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Como você deseja usar a OpenLearn?</label>
                <div className={styles.roleBtns} style={{ marginTop: 0 }}>
                  <button 
                    type="button" 
                    className={`${styles.roleBtn} ${role === 'student' ? styles.roleBtnActive : ''}`}
                    onClick={() => setRole('student')}
                    style={role === 'student' ? { background: 'var(--color-primary-50)', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : { borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                  >
                    Quero Aprender
                  </button>
                  <button 
                    type="button" 
                    className={`${styles.roleBtn} ${role === 'tutor' ? styles.roleBtnActive : ''}`}
                    onClick={() => setRole('tutor')}
                    style={role === 'tutor' ? { background: 'var(--color-primary-50)', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : { borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                  >
                    Quero Ensinar
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>Nome Completo</label>
                <input
                  type="text"
                  id="name"
                  className="input"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

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
                <label htmlFor="password" className={styles.label}>Senha</label>
                <input
                  type="password"
                  id="password"
                  className="input"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <button 
                type="submit" 
                className={`btn btn--primary ${styles.submitBtn}`}
                disabled={isLoading}
              >
                {isLoading ? 'Criando conta...' : 'Criar Conta Grátis'}
              </button>
            </form>

            <div className={styles.authFooter}>
              <p>Já tem uma conta? <a href="/login">Entrar</a></p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
