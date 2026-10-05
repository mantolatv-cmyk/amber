'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  Video, 
  DollarSign, 
  Calendar, 
  BookOpen, 
  User, 
  Sparkles, 
  Star, 
  TrendingUp, 
  ShieldCheck, 
  Clock, 
  Zap,
  Plus,
  X
} from 'lucide-react';
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
  { id: 0, label: 'Dom', full: 'Domingo' },
  { id: 1, label: 'Seg', full: 'Segunda-feira' },
  { id: 2, label: 'Ter', full: 'Terça-feira' },
  { id: 3, label: 'Qua', full: 'Quarta-feira' },
  { id: 4, label: 'Qui', full: 'Quinta-feira' },
  { id: 5, label: 'Sex', full: 'Sexta-feira' },
  { id: 6, label: 'Sáb', full: 'Sábado' },
];

const PRESET_SPECIALTIES = [
  "LangChain", "LlamaIndex", "Arquitetura RAG", "Fine-tuning de LLMs",
  "Engenharia de Prompts", "AI Agents", "OpenAI APIs", "Claude & Anthropic",
  "HuggingFace", "Python para IA", "DeepSeek", "Automação com n8n"
];

export default function OnboardingWizard({ subjects, initialProfile }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [headline, setHeadline] = useState(initialProfile?.headline || '');
  const [bio, setBio] = useState(initialProfile?.bio || '');
  const [yearsExperience, setYearsExperience] = useState(initialProfile?.yearsExperience || 3);
  const [videoIntroUrl, setVideoIntroUrl] = useState(initialProfile?.videoIntroUrl || '');
  const [avatarPreset, setAvatarPreset] = useState('tech-lead');

  // Subjects & Tags State
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    initialProfile?.subjects?.map((s: any) => s.subjectId) || [subjects[0]?.id || 'sub-1']
  );
  const [customTags, setCustomTags] = useState<string[]>(['RAG Architecture', 'LangChain']);
  const [newTagInput, setNewTagInput] = useState('');

  // Pricing State
  const [hourlyRate, setHourlyRate] = useState<number>(
    initialProfile?.hourlyRateCents ? initialProfile.hourlyRateCents / 100 : 150
  );
  const [enableTrial, setEnableTrial] = useState<boolean>(
    initialProfile?.trialRateCents !== null ? true : true
  );
  const [trialRate, setTrialRate] = useState<number>(
    initialProfile?.trialRateCents ? initialProfile.trialRateCents / 100 : 49
  );

  // Availability State
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

  const addCustomTag = (tag: string) => {
    const clean = tag.trim();
    if (clean && !customTags.includes(clean)) {
      setCustomTags(prev => [...prev, clean]);
    }
  };

  const removeCustomTag = (tag: string) => {
    setCustomTags(prev => prev.filter(t => t !== tag));
  };

  const applySchedulePreset = (preset: 'business' | 'nights' | 'all') => {
    if (preset === 'business') {
      setSelectedDays([1, 2, 3, 4, 5]);
      setStartHour('09:00');
      setEndHour('18:00');
    } else if (preset === 'nights') {
      setSelectedDays([1, 2, 3, 4, 5, 6]);
      setStartHour('18:00');
      setEndHour('22:00');
    } else {
      setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
      setStartHour('08:00');
      setEndHour('20:00');
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!headline.trim()) {
        toast.error('Informe seu título profissional (headline).');
        return;
      }
      if (!bio.trim() || bio.trim().length < 20) {
        toast.error('Escreva uma biografia de ao menos 20 caracteres para inspirar confiança aos alunos.');
        return;
      }
    } else if (step === 2) {
      if (selectedSubjects.length === 0) {
        toast.error('Selecione pelo menos uma matéria principal.');
        return;
      }
    } else if (step === 3) {
      if (!hourlyRate || hourlyRate < 50) {
        toast.error('O valor mínimo por hora é de R$ 50,00.');
        return;
      }
    } else if (step === 4) {
      if (selectedDays.length === 0) {
        toast.error('Selecione ao menos um dia da semana para atendimento.');
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
        toast.success('Perfil de tutor configurado e aprovado com sucesso! Bem-vindo(a) à OpenLearn.');
        router.push('/dashboard/tutor');
      }
    } catch {
      toast.error('Erro de conexão ao salvar.');
      setIsSubmitting(false);
    }
  };

  // Financial calculations
  const platformFeePercent = 15;
  const netEarnings = Math.round(hourlyRate * (1 - platformFeePercent / 100));
  const estimatedMonthly = netEarnings * 10 * 4; // 10 classes/week * 4 weeks

  return (
    <div className={styles.onboardingPage}>
      <div className={styles.container}>
        {/* Step Indicator */}
        <div className={styles.stepIndicator}>
          {[
            { num: 1, label: 'Perfil' },
            { num: 2, label: 'Especialidades' },
            { num: 3, label: 'Valores' },
            { num: 4, label: 'Horários' },
            { num: 5, label: 'Pré-visualização' },
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

          {/* STEP 1: PERFIL */}
          {step === 1 && (
            <div>
              <div className={styles.cardHeader}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--color-primary-50)', color: 'var(--color-primary)', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
                  <Sparkles size={14} /> Passo 1 de 5
                </div>
                <h1 className={styles.cardTitle}>Apresente-se aos seus futuros alunos</h1>
                <p className={styles.cardSubtitle}>
                  Um título claro e uma biografia focada em resolução de problemas aumentam em até 5x seus agendamentos.
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
                  placeholder="Ex: Engenheiro de IA Sênior | Especialista em LangChain, RAG e LLMs Corporativas"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  maxLength={100}
                />
                <span className={styles.helperText}>
                  {headline.length}/100 caracteres. Seja específico sobre as tecnologias que você domina.
                </span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <BookOpen size={16} style={{ display: 'inline', marginRight: 6 }} />
                  Biografia & Metodologia de Ensino *
                </label>
                <textarea
                  className="input"
                  style={{ minHeight: '120px', resize: 'vertical' }}
                  placeholder="Conte um pouco sobre sua trajetória profissional, projetos reais que já desenvolveu e como estrutura suas aulas práticas..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
                <span className={styles.helperText}>
                  {bio.length} caracteres. Recomendamos citar se você foca em código prático, projetos do zero ou revisão arquitetural.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <TrendingUp size={16} style={{ display: 'inline', marginRight: 6 }} />
                    Anos de Experiência com IA/Dev
                  </label>
                  <select
                    className="input"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(Number(e.target.value))}
                  >
                    <option value={1}>1 a 2 anos</option>
                    <option value={3}>3 a 5 anos</option>
                    <option value={6}>6 a 8 anos</option>
                    <option value={9}>9+ anos (Sênior / Lead)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <Video size={16} style={{ display: 'inline', marginRight: 6 }} />
                    Vídeo de Apresentação (YouTube / Vimeo)
                  </label>
                  <input
                    type="url"
                    className="input"
                    placeholder="https://youtube.com/watch?v=..."
                    value={videoIntroUrl}
                    onChange={(e) => setVideoIntroUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ESPECIALIDADES */}
          {step === 2 && (
            <div>
              <div className={styles.cardHeader}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--color-primary-50)', color: 'var(--color-primary)', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
                  <Sparkles size={14} /> Passo 2 de 5
                </div>
                <h1 className={styles.cardTitle}>Suas Especialidades & Matérias</h1>
                <p className={styles.cardSubtitle}>
                  Selecione as disciplinas principais que você deseja ensinar na OpenLearn.
                </p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Disciplinas da Plataforma (Selecione ao menos uma):</label>
                <div className={styles.subjectsGrid}>
                  {subjects.map((sub) => {
                    const isSelected = selectedSubjects.includes(sub.id);
                    return (
                      <div
                        key={sub.id}
                        className={`${styles.subjectCard} ${isSelected ? styles.subjectCardActive : ''}`}
                        onClick={() => toggleSubject(sub.id)}
                      >
                        <div className={styles.subjectCheckbox}>
                          {isSelected && <Check size={14} color="#fff" />}
                        </div>
                        <div>
                          <div className={styles.subjectName}>{sub.name}</div>
                          <span className={styles.subjectCategory}>{sub.category}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Specialty Tags */}
              <div className={styles.formGroup} style={{ marginTop: '24px' }}>
                <label className={styles.label}>Palavras-chave e Tags de Destaque:</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {PRESET_SPECIALTIES.map((preset) => {
                    const isAdded = customTags.includes(preset);
                    return (
                      <button
                        key={preset}
                        type="button"
                        className={`${styles.tagButton} ${isAdded ? styles.tagButtonAdded : ''}`}
                        onClick={() => isAdded ? removeCustomTag(preset) : addCustomTag(preset)}
                      >
                        {isAdded ? '✓ ' : '+ '} {preset}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Adicionar outra tag (ex: CrewAI, vLLM, Ollama)..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newTagInput.trim()) {
                          addCustomTag(newTagInput);
                          setNewTagInput('');
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      if (newTagInput.trim()) {
                        addCustomTag(newTagInput);
                        setNewTagInput('');
                      }
                    }}
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: VALORES & TRANSPARÊNCIA */}
          {step === 3 && (
            <div>
              <div className={styles.cardHeader}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--color-primary-50)', color: 'var(--color-primary)', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
                  <Sparkles size={14} /> Passo 3 de 5
                </div>
                <h1 className={styles.cardTitle}>Defina seu Preço e Ganhos</h1>
                <p className={styles.cardSubtitle}>
                  Você tem controle total sobre o valor da sua hora. Veja exatamente quanto receberá por aula.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
                <div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      <DollarSign size={16} style={{ display: 'inline', marginRight: 4 }} />
                      Valor por Hora (Aula Regular de 60 min)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                        R$
                      </span>
                      <input
                        type="number"
                        className="input"
                        style={{ paddingLeft: '44px', fontSize: '18px', fontWeight: 700 }}
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(Number(e.target.value))}
                        min={50}
                        step={10}
                      />
                    </div>
                    <span className={styles.helperText}>Média recomendada para tutores de IA: R$ 120 a R$ 220/hora.</span>
                  </div>

                  <div className={styles.formGroup}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={enableTrial}
                        onChange={(e) => setEnableTrial(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                      />
                      Oferecer Aula Experimental com Desconto (30 min)
                    </label>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                      Tutores com aula experimental recebem 3.8x mais primeiros contatos de alunos.
                    </p>
                  </div>

                  {enableTrial && (
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Valor da Aula Experimental (30 min)</label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                          R$
                        </span>
                        <input
                          type="number"
                          className="input"
                          style={{ paddingLeft: '44px', fontSize: '16px', fontWeight: 600 }}
                          value={trialRate}
                          onChange={(e) => setTrialRate(Number(e.target.value))}
                          min={0}
                          step={5}
                        />
                      </div>
                      <span className={styles.helperText}>Pode ser gratuita (R$ 0) ou valor promocional (ex: R$ 49).</span>
                    </div>
                  )}
                </div>

                {/* Live Earnings Projection Card */}
                <div style={{ background: 'var(--color-bg-subtle)', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '20px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={18} color="#10b981" /> Extrato Líquido por Aula
                  </h4>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Valor cobrado do aluno:</span>
                    <span style={{ fontWeight: 600 }}>R$ {hourlyRate.toFixed(2)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px', color: 'var(--color-text-muted)' }}>
                    <span>Taxa da plataforma (15%):</span>
                    <span>- R$ {(hourlyRate * 0.15).toFixed(2)}</span>
                  </div>

                  <div style={{ height: '1px', background: 'var(--color-border)', margin: '12px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700 }}>
                    <span style={{ color: 'var(--color-text)' }}>Você recebe líquido:</span>
                    <span style={{ color: '#10b981', fontSize: '20px' }}>R$ {netEarnings.toFixed(2)}</span>
                  </div>

                  <div style={{ marginTop: '16px', padding: '12px', background: 'var(--color-surface)', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                      Projeção Mensal (10 aulas/semana):
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary)' }}>
                      ~ R$ {estimatedMonthly.toLocaleString('pt-BR')} /mês
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                      ⚡ Repasse automático via PIX em até 24h após a confirmação da aula.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: HORÁRIOS */}
          {step === 4 && (
            <div>
              <div className={styles.cardHeader}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--color-primary-50)', color: 'var(--color-primary)', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
                  <Sparkles size={14} /> Passo 4 de 5
                </div>
                <h1 className={styles.cardTitle}>Disponibilidade de Atendimento</h1>
                <p className={styles.cardSubtitle}>
                  Defina os dias da semana e a faixa de horários em que os alunos podem agendar aulas com você.
                </p>
              </div>

              {/* Quick Presets */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={styles.presetBtn}
                  onClick={() => applySchedulePreset('business')}
                >
                  ⚡ Horário Comercial (Seg-Sex, 09h às 18h)
                </button>
                <button
                  type="button"
                  className={styles.presetBtn}
                  onClick={() => applySchedulePreset('nights')}
                >
                  🌙 Noites (18h às 22h)
                </button>
                <button
                  type="button"
                  className={styles.presetBtn}
                  onClick={() => applySchedulePreset('all')}
                >
                  🌟 Integral (Todos os dias)
                </button>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Dias da semana ativos:</label>
                <div className={styles.daysGrid}>
                  {DAYS.map((day) => {
                    const isSelected = selectedDays.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        className={`${styles.dayBtn} ${isSelected ? styles.dayBtnActive : ''}`}
                        onClick={() => toggleDay(day.id)}
                      >
                        <span className={styles.dayBtnLabel}>{day.label}</span>
                        <span className={styles.dayBtnSub}>{isSelected ? 'Ativo' : 'Folga'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <Clock size={16} style={{ display: 'inline', marginRight: 4 }} />
                    Horário Inicial de Atendimento
                  </label>
                  <input
                    type="time"
                    className="input"
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <Clock size={16} style={{ display: 'inline', marginRight: 4 }} />
                    Horário Final de Atendimento
                  </label>
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

          {/* STEP 5: LIVE PREVIEW */}
          {step === 5 && (
            <div>
              <div className={styles.cardHeader}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', color: '#065f46', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
                  <Check size={14} /> Passo Final
                </div>
                <h1 className={styles.cardTitle}>Pré-visualização do Seu Perfil Público</h1>
                <p className={styles.cardSubtitle}>
                  Confira como os alunos verão seu card de tutor no catálogo e nas buscas.
                </p>
              </div>

              {/* Tutor Preview Card */}
              <div className={styles.previewCard}>
                <div className={styles.previewCardTop}>
                  <div className={styles.previewAvatar}>
                    <User size={32} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 className={styles.previewName}>{headline.split('|')[0]?.trim() || 'Tutor de Inteligência Artificial'}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#f59e0b', fontWeight: 700 }}>
                          <Star size={14} fill="#f59e0b" /> Novo Tutor (5.0 ★) • {yearsExperience}+ anos exp.
                        </div>
                      </div>
                      <div className={styles.previewPriceBox}>
                        <div className={styles.previewPriceVal}>R$ {hourlyRate.toFixed(0)}</div>
                        <div className={styles.previewPriceSub}>por hora</div>
                      </div>
                    </div>
                  </div>
                </div>

                <p className={styles.previewHeadline}>{headline}</p>
                <p className={styles.previewBio}>{bio}</p>

                <div className={styles.previewTags}>
                  {customTags.map(tag => (
                    <span key={tag} className={styles.previewTag}>#{tag}</span>
                  ))}
                </div>

                <div className={styles.previewFooter}>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={15} color="var(--color-primary)" />
                    Disponível: {selectedDays.length} dias por semana ({startHour} às {endHour})
                  </div>
                  {enableTrial && (
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', background: 'var(--color-primary-50)', padding: '4px 8px', borderRadius: '8px' }}>
                      Aula experimental por R$ {trialRate.toFixed(0)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className={styles.cardFooter}>
            {step > 1 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleBack}
                disabled={isSubmitting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <ArrowLeft size={16} /> Voltar
              </button>
            )}

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
              {step < 5 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleNext}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  Continuar <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '12px 24px', 
                    fontSize: '15px', 
                    fontWeight: 700,
                    background: '#10b981',
                    borderColor: '#10b981'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="spin" /> Publicando perfil...
                    </>
                  ) : (
                    <>
                      <Check size={18} /> Publicar Perfil de Tutor
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
