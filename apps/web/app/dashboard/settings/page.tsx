'use client';

import React, { useState, useEffect } from 'react';
import { User, Shield, Bell, Loader2, CheckCircle } from 'lucide-react';
import { updateProfile, updatePassword, updateTimezone } from './actions';
import styles from './settings.module.css';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'notifications'>('profile');
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/v1/me');
        const data = await res.json();
        if (data.success) setUserData(data.data);
      } catch (err) {
        console.error('Failed to fetch user data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const nameParts = userData?.fullName?.split(' ') || ['', ''];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  const initials = (firstName[0] || '') + (lastName[0] || '');

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileMsg(null);
    const formData = new FormData(e.currentTarget);
    const result = await updateProfile(formData);
    if (result.success) {
      setProfileMsg({ type: 'success', text: 'Perfil salvo com sucesso!' });
    } else {
      setProfileMsg({ type: 'error', text: result.error || 'Erro desconhecido.' });
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordMsg(null);
    const formData = new FormData(e.currentTarget);
    const result = await updatePassword(formData);
    if (result.success) {
      setPasswordMsg({ type: 'success', text: 'Senha atualizada com sucesso!' });
      (e.target as HTMLFormElement).reset();
    } else {
      setPasswordMsg({ type: 'error', text: result.error || 'Erro desconhecido.' });
    }
  };

  if (isLoading) {
    return (
      <div className={styles.settingsContainer} style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
        <Loader2 size={32} className="spin" color="var(--color-primary)" />
      </div>
    );
  }

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.header}>
        <h1 className="heading-2">Configurações</h1>
        <p className="text-muted">Gerencie suas informações pessoais e preferências da plataforma.</p>
      </div>

      <div className={styles.layout}>
        {/* Settings Navigation */}
        <aside className={styles.sidebar}>
          <nav className={styles.navMenu}>
            <button 
              className={`${styles.navItem} ${activeTab === 'profile' ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <span className={styles.navIcon}><User size={18} /></span>
              Perfil Público
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'account' ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab('account')}
            >
              <span className={styles.navIcon}><Shield size={18} /></span>
              Conta e Segurança
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'notifications' ? styles.navItemActive : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <span className={styles.navIcon}><Bell size={18} /></span>
              Notificações
            </button>
          </nav>
        </aside>

        {/* Settings Content */}
        <main className={styles.content}>
          <div className={styles.card}>
            {activeTab === 'profile' && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Perfil Público</h2>
                <p className={styles.sectionSubtitle}>Estas informações serão visíveis para outros usuários na OpenLearn.</p>
                
                <div className={styles.avatarSection}>
                  <div className={styles.avatarPlaceholder}>{initials.toUpperCase()}</div>
                  <div className={styles.avatarActions}>
                    <button className="btn btn--secondary btn--sm">Trocar foto</button>
                    <button className={styles.textBtnDanger}>Remover</button>
                  </div>
                </div>

                <form className={styles.form} onSubmit={handleProfileSubmit}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Nome</label>
                      <input type="text" name="firstName" className="input" defaultValue={firstName} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Sobrenome</label>
                      <input type="text" name="lastName" className="input" defaultValue={lastName} />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Headline (Mini Bio)</label>
                    <input type="text" name="headline" className="input" defaultValue={userData?.headline || ''} placeholder="Ex: Desenvolvedor Front-end aprendendo IA" />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Biografia Completa</label>
                    <textarea name="bio" className="input" rows={4} defaultValue={userData?.bio || ''} placeholder="Conte um pouco sobre você e seus objetivos..."></textarea>
                  </div>

                  {profileMsg && (
                    <div style={{ padding: '12px', borderRadius: '8px', background: profileMsg.type === 'success' ? 'var(--color-success-bg)' : '#fff0f0', color: profileMsg.type === 'success' ? 'var(--color-success)' : '#c00', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {profileMsg.type === 'success' && <CheckCircle size={16} />}
                      {profileMsg.text}
                    </div>
                  )}

                  <div className={styles.formActions}>
                    <button type="submit" className="btn btn--primary">Salvar Alterações</button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'account' && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Conta e Segurança</h2>
                <p className={styles.sectionSubtitle}>Gerencie seu e-mail, senha e preferências de fuso horário.</p>

                <form className={styles.form}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>E-mail de acesso</label>
                    <input type="email" className="input" defaultValue={userData?.email || ''} disabled />
                    <span className={styles.helpText}>Para alterar seu e-mail, entre em contato com o suporte.</span>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Fuso Horário</label>
                    <select className="input" defaultValue={userData?.timezone || 'America/Sao_Paulo'} onChange={async (e) => {
                      const fd = new FormData();
                      fd.set('timezone', e.target.value);
                      await updateTimezone(fd);
                    }}>
                      <option value="America/Sao_Paulo">Horário de Brasília (BRT/BRST)</option>
                      <option value="America/Manaus">Horário do Amazonas (AMT)</option>
                      <option value="Europe/Lisbon">Horário de Lisboa (WET/WEST)</option>
                    </select>
                    <span className={styles.helpText}>Todos os horários das aulas serão exibidos neste fuso.</span>
                  </div>
                </form>

                <hr className={styles.divider} />

                <h3 className={styles.subTitle}>Alterar Senha</h3>

                <form className={styles.form} onSubmit={handlePasswordSubmit}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Senha Atual</label>
                    <input type="password" name="currentPassword" className="input" placeholder="••••••••" required />
                  </div>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Nova Senha</label>
                      <input type="password" name="newPassword" className="input" placeholder="••••••••" required minLength={8} />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Confirmar Nova Senha</label>
                      <input type="password" name="confirmPassword" className="input" placeholder="••••••••" required />
                    </div>
                  </div>

                  {passwordMsg && (
                    <div style={{ padding: '12px', borderRadius: '8px', background: passwordMsg.type === 'success' ? 'var(--color-success-bg)' : '#fff0f0', color: passwordMsg.type === 'success' ? 'var(--color-success)' : '#c00', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {passwordMsg.type === 'success' && <CheckCircle size={16} />}
                      {passwordMsg.text}
                    </div>
                  )}

                  <div className={styles.formActions}>
                    <button type="submit" className="btn btn--primary">Atualizar Senha</button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Notificações</h2>
                <p className={styles.sectionSubtitle}>Escolha como deseja ser avisado sobre suas aulas e mensagens.</p>

                <div className={styles.toggleList}>
                  <div className={styles.toggleItem}>
                    <div>
                      <h4 className={styles.toggleTitle}>Lembretes de Aula</h4>
                      <p className={styles.toggleDesc}>Receber e-mail 1h antes de cada aula começar.</p>
                    </div>
                    <label className={styles.switch}>
                      <input type="checkbox" defaultChecked />
                      <span className={styles.slider}></span>
                    </label>
                  </div>

                  <div className={styles.toggleItem}>
                    <div>
                      <h4 className={styles.toggleTitle}>Novas Mensagens</h4>
                      <p className={styles.toggleDesc}>Ser notificado quando um tutor responder ao seu chat.</p>
                    </div>
                    <label className={styles.switch}>
                      <input type="checkbox" defaultChecked />
                      <span className={styles.slider}></span>
                    </label>
                  </div>

                  <div className={styles.toggleItem}>
                    <div>
                      <h4 className={styles.toggleTitle}>Novidades da Plataforma</h4>
                      <p className={styles.toggleDesc}>Receber dicas de estudo e anúncios de novos cursos.</p>
                    </div>
                    <label className={styles.switch}>
                      <input type="checkbox" />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
