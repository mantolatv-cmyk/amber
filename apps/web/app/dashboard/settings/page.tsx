'use client';

import React, { useState, useEffect } from 'react';
import { User, Shield, Bell, Loader2, CheckCircle, DollarSign, BookOpen, Video } from 'lucide-react';
import { updateProfile, updatePassword, updateTimezone, updateTutorSettings } from './actions';
import styles from './settings.module.css';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'notifications' | 'tutor'>('profile');
  const [userData, setUserData] = useState<any>(null);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [tutorMsg, setTutorMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meRes, subRes] = await Promise.all([
          fetch('/api/v1/me'),
          fetch('/api/v1/subjects'),
        ]);

        const meData = await meRes.json();
        const subData = await subRes.json();

        if (meData.success) {
          setUserData(meData.data);
          if (meData.data?.tutorProfile?.subjects) {
            setSelectedSubjectIds(
              meData.data.tutorProfile.subjects.map((s: any) => s.subject.id)
            );
          }
        }

        if (subData.success) {
          setAllSubjects(subData.data);
        }
      } catch (err) {
        console.error('Failed to fetch settings data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
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

  const handleTutorSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTutorMsg(null);
    const formData = new FormData(e.currentTarget);
    formData.set('subjectIds', JSON.stringify(selectedSubjectIds));
    const result = await updateTutorSettings(formData);
    if (result.success) {
      setTutorMsg({ type: 'success', text: 'Configurações de tutor salvas com sucesso!' });
    } else {
      setTutorMsg({ type: 'error', text: result.error || 'Erro ao salvar configurações.' });
    }
  };

  const toggleSubject = (id: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
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
            {userData?.role === 'tutor' && (
              <button 
                className={`${styles.navItem} ${activeTab === 'tutor' ? styles.navItemActive : ''}`}
                onClick={() => setActiveTab('tutor')}
              >
                <span className={styles.navIcon}><DollarSign size={18} /></span>
                Preços e Especialidades
              </button>
            )}
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

            {activeTab === 'tutor' && userData?.role === 'tutor' && (
              <div className={styles.section}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h2 className={styles.sectionTitle}>Preços e Especialidades</h2>
                    <p className={styles.sectionSubtitle}>Defina o valor da sua hora de aula, matérias e modalidades de atendimento.</p>
                  </div>
                  <span style={{ 
                    padding: '6px 12px', 
                    borderRadius: '20px', 
                    fontSize: '12px', 
                    fontWeight: 600,
                    background: userData?.tutorProfile?.status === 'approved' ? 'var(--color-success-bg, #e8f5e9)' : 'var(--color-warning-bg, #fff8e1)',
                    color: userData?.tutorProfile?.status === 'approved' ? 'var(--color-success, #2e7d32)' : 'var(--color-warning, #f57f17)'
                  }}>
                    {userData?.tutorProfile?.status === 'approved' ? '● Perfil Ativo' : '● Em Análise'}
                  </span>
                </div>

                <form className={styles.form} onSubmit={handleTutorSubmit}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Valor por Hora de Aula (R$) *</label>
                      <input 
                        type="number" 
                        name="hourlyRate" 
                        className="input" 
                        min={30} 
                        max={3000} 
                        defaultValue={userData?.tutorProfile?.hourlyRateCents ? userData.tutorProfile.hourlyRateCents / 100 : 120} 
                        required 
                      />
                      <span className={styles.helpText}>Valor bruto por 60 min de mentoria.</span>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Anos de Experiência com IA</label>
                      <input 
                        type="number" 
                        name="yearsExperience" 
                        className="input" 
                        min={0} 
                        max={40} 
                        defaultValue={userData?.tutorProfile?.yearsExperience || 2} 
                      />
                    </div>
                  </div>

                  <div style={{ padding: '16px', background: 'var(--color-surface-hover, #f8f9fa)', borderRadius: '12px', marginBottom: '24px' }}>
                    <div className={styles.formGroup} style={{ marginBottom: 12 }}>
                      <label className={styles.label}>Aula Experimental (R$)</label>
                      <input 
                        type="number" 
                        name="trialRate" 
                        className="input" 
                        min={0} 
                        max={1000} 
                        defaultValue={userData?.tutorProfile?.trialRateCents ? userData.tutorProfile.trialRateCents / 100 : 60} 
                      />
                      <span className={styles.helpText}>Deixe 0 se não quiser oferecer aula experimental com desconto.</span>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Link do Vídeo de Apresentação (YouTube / Loom)</label>
                    <input 
                      type="url" 
                      name="videoIntroUrl" 
                      className="input" 
                      defaultValue={userData?.tutorProfile?.videoIntroUrl || ''} 
                      placeholder="https://www.youtube.com/watch?v=..." 
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Título Profissional (Headline)</label>
                    <input 
                      type="text" 
                      name="headline" 
                      className="input" 
                      defaultValue={userData?.tutorProfile?.headline || ''} 
                      placeholder="Ex: Desenvolvedor Senior & Mentor de RAG e LangChain" 
                      required 
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Biografia Completa</label>
                    <textarea 
                      name="bio" 
                      className="input" 
                      rows={4} 
                      defaultValue={userData?.tutorProfile?.bio || ''} 
                      placeholder="Fale sobre seu background, empresas por onde passou e sua didática..." 
                      required 
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Especialidades de Ensino (Clique para marcar/desmarcar)</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                      {allSubjects.map((sub: any) => {
                        const isSelected = selectedSubjectIds.includes(sub.id);
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => toggleSubject(sub.id)}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '20px',
                              border: '1.5px solid',
                              borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                              background: isSelected ? 'var(--color-primary-50, #f0edff)' : 'var(--color-surface)',
                              color: isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                              cursor: 'pointer',
                              fontWeight: isSelected ? 600 : 400,
                              fontSize: '13px',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {isSelected ? '✓ ' : '+ '}{sub.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {tutorMsg && (
                    <div style={{ padding: '12px', borderRadius: '8px', background: tutorMsg.type === 'success' ? 'var(--color-success-bg, #e8f5e9)' : '#fff0f0', color: tutorMsg.type === 'success' ? 'var(--color-success, #2e7d32)' : '#c00', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 16 }}>
                      {tutorMsg.type === 'success' && <CheckCircle size={16} />}
                      {tutorMsg.text}
                    </div>
                  )}

                  <div className={styles.formActions}>
                    <button type="submit" className="btn btn--primary">Salvar Especialidades e Valores</button>
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
