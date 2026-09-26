'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, ArrowRight, ArrowLeft, Loader2, Video, DollarSign, Calendar, BookOpen, User } from 'lucide-react';
import { submitTutorOnboarding } from './actions';
import styles from './onboarding.module.css';

interface Subject {
  id: string;
  name: string;
  category: string;
}

interface OnboardingWizardProps {
  subjects: Subject[];
  initialProfile: any;
}

const DAYS = [
  { id: 0, label: 'Dom' },
  { id: 1, label: 'Seg' },
  { id: 2, label: 'Ter' },
  { id: 3, label: 'Qua' },
  { id: 4, label: 'Qui' },
  { id: 5, label: 'Sex' },
  { id: 6, label: 'Sáb' },
];

export default function OnboardingWizard({ subjects, initialProfile }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [headline, setHeadline] = useState(initialProfile?.headline || '');
  const [bio, setBio] = useState(initialProfile?.bio || '');
  const [yearsExperience, setYearsExperience] = useState(initialProfile?.yearsExperience || 2);
  const [videoIntroUrl, setVideoIntroUrl] = useState(initialProfile?.videoIntroUrl || '');

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    initialProfile?.subjects?.map((s: any) => s.subjectId) || []
  );

  const [hourlyRate, setHourlyRate] = useState(
    initialProfile?.hourlyRateCents ? initialProfile.hourlyRateCents / 100 : 120
  );
  const [enableTrial, setEnableTrial] = useState(
    initialProfile?.trialRateCents ? true : true
  );
  const [trialRate, setTrialRate] = useState(
    initialProfile?.trialRateCents ? initialProfile.trialRateCents / 100 : 60
  );

  const [selectedDays, setSelectedDays] = useState<number[]>(
    initialProfile?.availability?.length > 0
      ? initialProfile.availability.map((a: any) => a.dayOfWeek)
      : [1, 2, 3, 4, 5]
  );
  const [startHour, setStartHour] = useState('09:00');
  const [endHour, setEndHour] = useState('18:00');

  const toggleSubject = (id: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleDay = (dayId: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  const handleNext = () => {
    if (step === 1) {
      if (!headline.trim() || !bio.trim()) {
        toast.error('Preencha seu título profissional e biografia.');
        return;
      }
    } else if (step === 2) {
      if (selectedSubjects.length === 0) {
        toast.error('Selecione pelo menos uma especialidade.');
        return;
      }
    } else if (step === 3) {
      if (!hourlyRate || hourlyRate <= 0) {
        toast.error('Informe um valor por hora válido.');
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await submitTutorOnboarding({
        headline,
        bio,
        yearsExperience: Number(yearsExperience),
        videoIntroUrl,
        hourlyRate: Number(hourlyRate),
        enableTrial,
        trialRate: Number(trialRate),
        subjectIds: selectedSubjects,
        daysOfWeek: selectedDays,
        startHour,
        endHour,
      });

      if (res.error) {
        toast.error(res.error);
        setIsSubmitting(false);
      } else {
        toast.success('Perfil de tutor configurado com sucesso!');
        router.push('/dashboard/tutor');
      }
    } catch {
      toast.error('Erro de conexão ao salvar.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.onboardingPage}>
      <div className={styles.container}>
        {/* Step Indicator */}
        <div className={styles.stepIndicator}>
          {[
            { num: 1, label: 'Perfil' },
            { num: 2, label: 'Matérias' },
            { num: 3, label: 'Valores' },
            { num: 4, label: 'Horários' },
          ].map((item) => (
            <div
              key={item.num}
              className={`${styles.stepItem} ${
                step === item.num
                  ? styles.stepItemActive
                  : step > item.num
                  ? styles.stepItemCompleted
                  : ''
              }`}
            >
              <div className={styles.stepNumber}>
                {step > item.num ? <Check size={16} /> : item.num}
              </div>
              <span className={styles.stepLabel}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Step Cards */}
        <div className={styles.card}>
          {step === 1 && (
            <div>
              <div className={styles.cardHeader}>
                <h1 className={styles.cardTitle}>Apresente-se aos seus futuros alunos</h1>
                <p className={styles.cardSubtitle}>
                  Um perfil completo e atrativo aumenta em até 5x suas chances de agendamento.
                </p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <User size={16} style={{ display: 'inline', marginRight: 6 }} />
                  Título Profissional (Headline) *
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ex: Engenheiro de IA Senior | Especialista em LangChain e RAG"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  maxLength={180}
                />
                <span className={styles.helpText}>Esta frase aparecerá nos cards de busca.</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Biografia e Metodologia de Ensino *</label>
                <textarea
                  className="input"
                  rows={5}
                  placeholder="Descreva sua experiência prática com Inteligência Artificial, os projetos em que atuou e como você conduz suas mentorias..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              <div className={styles.pricingRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Anos de Experiência</label>
                  <input
                    type="number"
                    className="input"
                    min={0}
                    max={40}
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(Number(e.target.value))}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <Video size={16} style={{ display: 'inline', marginRight: 6 }} />
                    Link do Vídeo de Apresentação (Opcional)
                  </label>
                  <input
                    type="url"
                    className="input"
                    placeholder="https://youtube.com/watch?v=... ou Loom"
                    value={videoIntroUrl}
                    onChange={(e) => setVideoIntroUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className={styles.cardHeader}>
                <h1 className={styles.cardTitle}>O que você ensina?</h1>
                <p className={styles.cardSubtitle}>
                  Selecione as especialidades de IA em que você oferece mentoria e aulas práticas.
                </p>
              </div>

              <div className={styles.subjectsGrid}>
                {subjects.map((sub) => {
                  const active = selectedSubjects.includes(sub.id);
                  return (
                    <div
                      key={sub.id}
                      className={`${styles.subjectChip} ${active ? styles.subjectChipActive : ''}`}
                      onClick={() => toggleSubject(sub.id)}
                    >
                      <div>
                        <span>{sub.name}</span>
                        <span className={styles.badgeCategory}>{sub.category}</span>
                      </div>
                      {active && <Check size={18} color="var(--color-primary)" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className={styles.cardHeader}>
                <h1 className={styles.cardTitle}>Defina sua remuneração</h1>
                <p className={styles.cardSubtitle}>
                  Você recebe seus repasses automaticamente via Stripe após a conclusão de cada aula.
                </p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Valor por Hora de Aula (R$) *</label>
                <div className={styles.inputPrefixWrapper}>
                  <span className={styles.inputPrefix}>R$</span>
                  <input
                    type="number"
                    className={`input ${styles.inputWithPrefix}`}
                    min={30}
                    max={2000}
                    step={10}
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                  />
                </div>
                <span className={styles.helpText}>Valor padrão para 60 minutos de mentoria individual.</span>
              </div>

              <div style={{ marginTop: '24px', padding: '16px', background: 'var(--color-surface-hover)', borderRadius: '12px' }}>
                <label className={styles.trialToggle}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={enableTrial}
                    onChange={(e) => setEnableTrial(e.target.checked)}
                  />
                  <div>
                    <span style={{ fontWeight: 600 }}>Oferecer Aula Experimental com desconto</span>
                    <span className={styles.helpText}>Alunos tendem a fechar pacotes regulares após a primeira aula.</span>
                  </div>
                </label>

                {enableTrial && (
                  <div className={styles.formGroup} style={{ marginTop: '16px' }}>
                    <label className={styles.label}>Valor da Aula Experimental (R$)</label>
                    <div className={styles.inputPrefixWrapper}>
                      <span className={styles.inputPrefix}>R$</span>
                      <input
                        type="number"
                        className={`input ${styles.inputWithPrefix}`}
                        min={0}
                        max={hourlyRate}
                        step={5}
                        value={trialRate}
                        onChange={(e) => setTrialRate(Number(e.target.value))}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div className={styles.cardHeader}>
                <h1 className={styles.cardTitle}>Disponibilidade de Atendimento</h1>
                <p className={styles.cardSubtitle}>
                  Defina os dias da semana e horários em que os alunos podem agendar aulas com você.
                </p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Dias da Semana Disponíveis</label>
                <div className={styles.daysGrid}>
                  {DAYS.map((d) => {
                    const active = selectedDays.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        className={`${styles.dayBtn} ${active ? styles.dayBtnActive : ''}`}
                        onClick={() => toggleDay(d.id)}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.pricingRow} style={{ marginTop: '24px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Horário Inicial (Horário de Brasília)</label>
                  <input
                    type="time"
                    className="input"
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Horário Final</label>
                  <input
                    type="time"
                    className="input"
                    value={endHour}
                    onChange={(e) => setEndHour(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className={styles.actions}>
            {step > 1 ? (
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handleBack}
                disabled={isSubmitting}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <ArrowLeft size={16} /> Voltar
              </button>
            ) : <div />}

            {step < 4 ? (
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleNext}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                Próximo <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {isSubmitting ? (
                  <>Salvando Perfil... <Loader2 size={16} className="spin" /></>
                ) : (
                  <>Concluir e Ir ao Painel <Check size={16} /></>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
