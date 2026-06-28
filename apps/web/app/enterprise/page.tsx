'use client';

import React, { useState } from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';
import { Building2, LineChart, ShieldCheck, CheckCircle2 } from 'lucide-react';
import styles from './enterprise.module.css';

export default function EnterprisePage() {
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('submitting');
    
    // Simulate API call
    setTimeout(() => {
      setFormState('success');
    }, 1500);
  };

  return (
    <div className={styles.enterprisePage}>
      <Header
        variant="light"
        navLinks={[
          { label: 'Matérias', href: '/#subjects' },
          { label: 'Tutores', href: '/#tutors' },
          { label: 'Como Funciona', href: '/#how-it-works' },
          { label: 'Para Empresas', href: '/enterprise' },
        ]}
      />

      <main>
        {/* ---- Hero Section ---- */}
        <section className={styles.hero}>
          <div className={styles.heroMesh} />
          <div className={styles.heroContainer}>
            <div className={styles.badge}>
              <Building2 size={16} /> OpenLearn Corporate
            </div>
            <h1 className={styles.heroTitle}>
              Capacite seu time com a <span className={styles.heroTitleGradient}>Inteligência do Futuro</span>
            </h1>
            <p className={styles.heroSubtitle}>
              O mercado está mudando rápido. Leve os melhores tutores de IA do mundo para treinar seus desenvolvedores, analistas e líderes através de uma plataforma exclusiva para equipes.
            </p>
            <button className="btn btn--primary btn--lg" onClick={() => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })}>
              Falar com Especialista
            </button>
          </div>
        </section>

        {/* ---- Features Section ---- */}
        <section className={styles.features}>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon} style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
                <LineChart size={32} />
              </div>
              <h3 className={styles.featureTitle}>Painel de Gestão B2B</h3>
              <p className={styles.featureDesc}>
                Acompanhe o engajamento da sua equipe. Veja quais habilidades de IA estão sendo desenvolvidas, horas de treinamento realizadas e o ROI do seu investimento.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon} style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
                <Building2 size={32} />
              </div>
              <h3 className={styles.featureTitle}>Orçamento Centralizado</h3>
              <p className={styles.featureDesc}>
                Compre créditos corporativos em lote. Sua equipe usa os créditos para agendar aulas com os especialistas, sem necessidade de reembolsos individuais.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon} style={{ background: 'var(--color-warning-bg)', color: '#B8860B' }}>
                <ShieldCheck size={32} />
              </div>
              <h3 className={styles.featureTitle}>SSO & Segurança</h3>
              <p className={styles.featureDesc}>
                Integração nativa com Okta, Azure AD e Google Workspace. Controle de acessos robusto e garantia de privacidade nas sessões de treinamento (NDAs garantidos).
              </p>
            </div>
          </div>
        </section>

        {/* ---- Contact Form Section ---- */}
        <section className={styles.contact} id="contact-form">
          <div className={styles.contactContainer}>
            <div className={styles.contactHeader}>
              <h2 className={styles.contactTitle}>Pronto para acelerar sua equipe?</h2>
              <p className="text-muted">
                Preencha os dados abaixo e nosso time de especialistas corporativos entrará em contato em menos de 24 horas.
              </p>
            </div>

            <div className={styles.contactCard}>
              {formState === 'success' ? (
                <div className={styles.successMessage}>
                  <div className={styles.successIcon}>
                    <CheckCircle2 size={32} color="var(--color-success)" />
                  </div>
                  <h3 className={styles.successTitle}>Mensagem Enviada!</h3>
                  <p>Obrigado pelo interesse. Nossa equipe de parcerias entrará em contato em breve para agendar uma demonstração.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label htmlFor="name" className={styles.label}>Nome Completo</label>
                      <input type="text" id="name" required className={styles.input} placeholder="João Silva" disabled={formState === 'submitting'} />
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label htmlFor="email" className={styles.label}>E-mail Corporativo</label>
                      <input type="email" id="email" required className={styles.input} placeholder="joao@suaempresa.com.br" disabled={formState === 'submitting'} />
                    </div>

                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                      <label htmlFor="company" className={styles.label}>Nome da Empresa</label>
                      <input type="text" id="company" required className={styles.input} placeholder="Acme Corp" disabled={formState === 'submitting'} />
                    </div>

                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                      <label htmlFor="size" className={styles.label}>Tamanho da Equipe (Funcionários)</label>
                      <select id="size" className={styles.input} required disabled={formState === 'submitting'}>
                        <option value="">Selecione uma opção</option>
                        <option value="1-50">1 a 50</option>
                        <option value="51-200">51 a 200</option>
                        <option value="201-1000">201 a 1000</option>
                        <option value="1000+">Mais de 1000</option>
                      </select>
                    </div>

                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                      <label htmlFor="message" className={styles.label}>Como podemos ajudar?</label>
                      <textarea 
                        id="message" 
                        required 
                        className={`${styles.input} ${styles.textarea}`} 
                        placeholder="Quais são os principais desafios da sua equipe hoje?"
                        disabled={formState === 'submitting'}
                      />
                    </div>
                  </div>

                  <button type="submit" className={`btn btn--primary ${styles.submitBtn}`} disabled={formState === 'submitting'}>
                    {formState === 'submitting' ? 'Enviando...' : 'Solicitar Contato Comercial'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
