'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  CalendarCheck, 
  Clock, 
  User, 
  ArrowRight, 
  Loader2, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  Sun, 
  Sunset, 
  Moon, 
  CheckCircle2, 
  FileText,
  CreditCard,
  QrCode
} from 'lucide-react';
import Header from '../../../components/Header/Header';
import styles from './book.module.css';

interface TutorInfo {
  id?: string;
  name: string;
  headline?: string;
  hourlyRateCents: number;
  trialRateCents: number | null;
  currency: string;
  subjectName?: string;
}

interface AvailSlot {
  dayOfWeek: number;
  startTimeUtc: string;
  endTimeUtc: string;
}

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const QUICK_GOALS = [
  "Aprender RAG do Zero",
  "Revisar Pipeline de Prompts",
  "Criar Agente com LangChain",
  "Fine-tuning & Modelos Abertos",
  "Preparação p/ Entrevista de IA"
];

export default function BookingPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter();
  const unwrappedParams = typeof (params as any)?.then === 'function' ? use(params as any) : params;
  const tutorId = unwrappedParams?.id || 'tutor-1';

  const [tutorInfo, setTutorInfo] = useState<TutorInfo | null>(null);
  const [availSlots, setAvailSlots] = useState<AvailSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isTrial, setIsTrial] = useState(true);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Generate next 14 calendar dates
  const nextDates = React.useMemo(() => {
    const list: Date[] = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      list.push(d);
    }
    return list;
  }, []);

  // Fetch tutor info + availability
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/v1/tutors/${tutorId}/availability`);
        const data = await res.json();
        if (data.success) {
          setTutorInfo(data.data.tutor);
          setAvailSlots(data.data.availability || []);
        }
      } catch (err) {
        console.error("Failed to load tutor data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [tutorId]);

  // Set initial selected date to first date with available slots
  useEffect(() => {
    if (availSlots.length > 0 && !selectedDate) {
      const availableDays = new Set(availSlots.map(s => s.dayOfWeek));
      const firstValidDate = nextDates.find(d => availableDays.has(d.getDay())) || nextDates[0];
      setSelectedDate(firstValidDate);
    }
  }, [availSlots, nextDates, selectedDate]);

  // Filter slots for selected date
  const selectedDayOfWeek = selectedDate ? selectedDate.getDay() : 1;
  const timesForSelectedDay = availSlots
    .filter(s => s.dayOfWeek === selectedDayOfWeek)
    .map(s => s.startTimeUtc.substring(0, 5));

  // Partition times into periods
  const morningSlots = timesForSelectedDay.filter(t => parseInt(t.split(':')[0], 10) < 12);
  const afternoonSlots = timesForSelectedDay.filter(t => {
    const h = parseInt(t.split(':')[0], 10);
    return h >= 12 && h < 18;
  });
  const eveningSlots = timesForSelectedDay.filter(t => parseInt(t.split(':')[0], 10) >= 18);

  const priceCents = isTrial && tutorInfo?.trialRateCents
    ? tutorInfo.trialRateCents
    : (tutorInfo?.hourlyRateCents || 15000);
  const priceFormatted = `R$ ${(priceCents / 100).toFixed(2)}`;

  const regularPriceCents = tutorInfo?.hourlyRateCents || 15000;
  const savingsCents = isTrial ? regularPriceCents - priceCents : 0;

  const handleProceedToCheckout = () => {
    if (!selectedDate || !selectedTime) return;

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const start = new Date(selectedDate);
    start.setHours(hours || 0, minutes || 0, 0, 0);

    const durationMinutes = isTrial ? 30 : 60;
    const end = new Date(start.getTime() + durationMinutes * 60000);

    const query = new URLSearchParams({
      tutorId,
      tutorName: tutorInfo?.name || 'Tutor',
      headline: tutorInfo?.headline || 'Tutor de IA',
      subjectName: tutorInfo?.subjectName || 'Inteligência Artificial',
      scheduledStart: start.toISOString(),
      scheduledEnd: end.toISOString(),
      durationMinutes: durationMinutes.toString(),
      isTrial: isTrial ? 'true' : 'false',
      priceCents: priceCents.toString(),
      notes: notes.trim(),
    });

    router.push(`/checkout?${query.toString()}`);
  };

  if (isLoading) {
    return (
      <>
        <Header variant="light" navLinks={[]} backLink={{ label: 'Voltar ao Perfil', href: `/tutor/${tutorId}` }} />
        <main className={styles.bookingPage}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column', gap: '16px' }}>
            <Loader2 size={36} className="spin" color="var(--color-primary)" />
            <p style={{ fontWeight: 500, color: 'var(--color-text-secondary)' }}>Carregando agenda do tutor...</p>
          </div>
        </main>
      </>
    );
  }

  const tutorInitials = (tutorInfo?.name || 'Tutor')
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <>
      <Header variant="light" navLinks={[]} backLink={{ label: 'Voltar ao Perfil', href: `/tutor/${tutorId}` }} />
      
      <main className={styles.bookingPage}>
        <div className={styles.container}>
          {/* Header Title */}
          <div className={styles.header}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--color-primary-50)', color: 'var(--color-primary)', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
              <Sparkles size={15} /> Agendamento Online Garantido
            </div>
            <h1 className="heading-2">Escolha o Melhor Momento para sua Aula</h1>
            <p className="text-muted">Aulas particulares 1:1 ao vivo com prática imediata no editor interativo.</p>
          </div>

          <div className={styles.layout}>
            {/* Left Column: Flow Steps */}
            <div className={styles.mainCol}>

              {/* Step 1: Lesson Type */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <span className={styles.stepBadge}>1</span> Tipo de Aula
                </h3>
                <div className={styles.typeSelectorGrid}>
                  <div
                    className={`${styles.typeCard} ${isTrial ? styles.typeCardActive : ''}`}
                    onClick={() => setIsTrial(true)}
                  >
                    <div className={styles.typeCardTop}>
                      <span className={styles.typeBadgePrimary}>Recomendado para Iniciantes</span>
                      {isTrial && <CheckCircle2 size={18} color="var(--color-primary)" />}
                    </div>
                    <div className={styles.typeTitle}>Aula Experimental (30 min)</div>
                    <p className={styles.typeDesc}>
                      Alinhe seus objetivos de aprendizado, tire dúvidas e conheça a metodologia do tutor.
                    </p>
                    <div className={styles.typePrice}>
                      {tutorInfo?.trialRateCents 
                        ? `R$ ${(tutorInfo.trialRateCents / 100).toFixed(0)}` 
                        : 'Grátis'}
                      {savingsCents > 0 && (
                        <span className={styles.typeSavings}>Economize R$ {(savingsCents / 100).toFixed(0)}</span>
                      )}
                    </div>
                  </div>

                  <div
                    className={`${styles.typeCard} ${!isTrial ? styles.typeCardActive : ''}`}
                    onClick={() => setIsTrial(false)}
                  >
                    <div className={styles.typeCardTop}>
                      <span className={styles.typeBadgeSecondary}>Aprofundamento</span>
                      {!isTrial && <CheckCircle2 size={18} color="var(--color-primary)" />}
                    </div>
                    <div className={styles.typeTitle}>Aula Completa (60 min)</div>
                    <p className={styles.typeDesc}>
                      Sessão intensiva de programação, revisão de código ou desenvolvimento de projetos de IA.
                    </p>
                    <div className={styles.typePrice}>
                      R$ {((tutorInfo?.hourlyRateCents || 15000) / 100).toFixed(0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Date Selector */}
              <div className={styles.section}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 className={styles.sectionTitle} style={{ margin: 0 }}>
                    <span className={styles.stepBadge}>2</span> Escolha a Data
                  </h3>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Próximos 14 dias disponíveis</span>
                </div>

                <div className={styles.datesScroller}>
                  {nextDates.map((dateItem, idx) => {
                    const isSelected = selectedDate && dateItem.toDateString() === selectedDate.toDateString();
                    const daySlotsCount = availSlots.filter(s => s.dayOfWeek === dateItem.getDay()).length;
                    const hasSlots = daySlotsCount > 0;

                    const isToday = idx === 0;
                    const isTomorrow = idx === 1;
                    const dayLabel = isToday ? 'Hoje' : isTomorrow ? 'Amanhã' : DAY_NAMES[dateItem.getDay()].substring(0, 3);

                    return (
                      <button
                        key={dateItem.toISOString()}
                        className={`${styles.datePill} ${isSelected ? styles.datePillActive : ''} ${!hasSlots ? styles.datePillEmpty : ''}`}
                        onClick={() => {
                          setSelectedDate(dateItem);
                          setSelectedTime(null);
                        }}
                        disabled={!hasSlots}
                      >
                        <div className={styles.datePillDayName}>{dayLabel}</div>
                        <div className={styles.datePillNumber}>{dateItem.getDate()}</div>
                        <div className={styles.datePillMonth}>{MONTH_NAMES[dateItem.getMonth()]}</div>
                        {hasSlots ? (
                          <span className={styles.datePillSlotsBadge}>{daySlotsCount} {daySlotsCount === 1 ? 'vaga' : 'vagas'}</span>
                        ) : (
                          <span className={styles.datePillNoSlots}>Indisp.</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Time Slot Selector */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <span className={styles.stepBadge}>3</span> Escolha o Horário
                </h3>

                {timesForSelectedDay.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', background: 'var(--color-bg-subtle)', borderRadius: '12px' }}>
                    <Clock size={32} color="var(--color-text-muted)" style={{ margin: '0 auto 8px' }} />
                    <p style={{ fontWeight: 600, color: 'var(--color-text)' }}>Nenhum horário disponível para esta data</p>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                      Por favor, selecione outra data acima com vagas disponíveis.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Manhã */}
                    {morningSlots.length > 0 && (
                      <div>
                        <div className={styles.periodHeading}>
                          <Sun size={16} color="#f59e0b" /> Manhã (08h às 12h)
                        </div>
                        <div className={styles.slotsGrid}>
                          {morningSlots.map(timeStr => (
                            <button
                              key={timeStr}
                              className={`${styles.slotBtn} ${selectedTime === timeStr ? styles.slotBtnActive : ''}`}
                              onClick={() => setSelectedTime(timeStr)}
                            >
                              <span className={styles.slotTimeText}>{timeStr}</span>
                              <span className={styles.slotDurationText}>{isTrial ? '30 min' : '60 min'}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tarde */}
                    {afternoonSlots.length > 0 && (
                      <div>
                        <div className={styles.periodHeading}>
                          <Sunset size={16} color="#ea580c" /> Tarde (12h às 18h)
                        </div>
                        <div className={styles.slotsGrid}>
                          {afternoonSlots.map(timeStr => (
                            <button
                              key={timeStr}
                              className={`${styles.slotBtn} ${selectedTime === timeStr ? styles.slotBtnActive : ''}`}
                              onClick={() => setSelectedTime(timeStr)}
                            >
                              <span className={styles.slotTimeText}>{timeStr}</span>
                              <span className={styles.slotDurationText}>{isTrial ? '30 min' : '60 min'}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Noite */}
                    {eveningSlots.length > 0 && (
                      <div>
                        <div className={styles.periodHeading}>
                          <Moon size={16} color="#6366f1" /> Noite (18h às 22h)
                        </div>
                        <div className={styles.slotsGrid}>
                          {eveningSlots.map(timeStr => (
                            <button
                              key={timeStr}
                              className={`${styles.slotBtn} ${selectedTime === timeStr ? styles.slotBtnActive : ''}`}
                              onClick={() => setSelectedTime(timeStr)}
                            >
                              <span className={styles.slotTimeText}>{timeStr}</span>
                              <span className={styles.slotDurationText}>{isTrial ? '30 min' : '60 min'}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 4: Notes & Learning Goals */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                  <span className={styles.stepBadge}>4</span> O que você quer aprender nesta aula?
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                  Compartilhe suas dúvidas ou escolha uma sugestão rápida para o tutor preparar o material com antecedência:
                </p>

                {/* Quick Goal Pills */}
                <div className={styles.goalsWrap}>
                  {QUICK_GOALS.map(goal => (
                    <button
                      key={goal}
                      type="button"
                      className={`${styles.goalPill} ${notes.includes(goal) ? styles.goalPillActive : ''}`}
                      onClick={() => {
                        if (!notes) {
                          setNotes(goal);
                        } else if (!notes.includes(goal)) {
                          setNotes(prev => `${prev}\n- ${goal}`);
                        }
                      }}
                    >
                      + {goal}
                    </button>
                  ))}
                </div>

                <textarea
                  className="input"
                  style={{ width: '100%', minHeight: '100px', resize: 'vertical', marginTop: '12px' }}
                  placeholder="Ex: Quero tirar dúvidas sobre o framework LangChain e implementar um pipeline de RAG com banco vetorial..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

            </div>

            {/* Right Column: Live Order Summary Card */}
            <div className={styles.summaryCol}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryTutorInfo}>
                  <div className={styles.summaryAvatar}>{tutorInitials}</div>
                  <div>
                    <h4 className={styles.summaryTutorName}>{tutorInfo?.name || 'Tutor'}</h4>
                    <p className={styles.summaryTutorHeadline}>{tutorInfo?.headline || 'Especialista em Inteligência Artificial'}</p>
                    <span className={styles.summarySubjectBadge}>
                      {tutorInfo?.subjectName || 'Inteligência Artificial'}
                    </span>
                  </div>
                </div>

                <div className={styles.summaryDivider} />

                {/* Selected Schedule Details */}
                <div className={styles.summarySection}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Tipo de Aula</span>
                    <span className={styles.summaryValue}>{isTrial ? 'Experimental (30 min)' : 'Completa (60 min)'}</span>
                  </div>

                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Data</span>
                    <span className={styles.summaryValue}>
                      {selectedDate 
                        ? `${DAY_NAMES[selectedDate.getDay()]}, ${selectedDate.getDate()} de ${MONTH_NAMES[selectedDate.getMonth()]}`
                        : 'Selecione uma data'}
                    </span>
                  </div>

                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Horário</span>
                    <span className={styles.summaryValue}>
                      {selectedTime ? `${selectedTime} (Horário de Brasília)` : 'Selecione um horário'}
                    </span>
                  </div>
                </div>

                <div className={styles.summaryDivider} />

                {/* Price Calculation */}
                <div className={styles.summarySection}>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Valor da Sessão</span>
                    <span className={styles.summaryValue}>{priceFormatted}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}>Taxa da Plataforma</span>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>Grátis (R$ 0,00)</span>
                  </div>

                  {savingsCents > 0 && (
                    <div className={styles.summaryRow} style={{ color: 'var(--color-primary)' }}>
                      <span className={styles.summaryLabel}>Desconto Experimental</span>
                      <span style={{ fontWeight: 600 }}>- R$ {(savingsCents / 100).toFixed(2)}</span>
                    </div>
                  )}

                  <div className={styles.summaryTotalRow}>
                    <span>Total</span>
                    <span className={styles.summaryTotalAmount}>{priceFormatted}</span>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  className={`${styles.submitBtn} ${(!selectedDate || !selectedTime) ? styles.submitBtnDisabled : ''}`}
                  disabled={!selectedDate || !selectedTime}
                  onClick={handleProceedToCheckout}
                >
                  Continuar para Pagamento <ArrowRight size={18} />
                </button>

                {(!selectedDate || !selectedTime) && (
                  <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '8px' }}>
                    Escolha uma data e horário à esquerda para continuar.
                  </p>
                )}

                {/* Trust & Guarantee Badges */}
                <div className={styles.trustBadges}>
                  <div className={styles.trustBadgeItem}>
                    <ShieldCheck size={18} color="#10b981" />
                    <span>Garantia 100% de Satisfação na 1ª Aula</span>
                  </div>
                  <div className={styles.trustBadgeItem}>
                    <CreditCard size={18} color="var(--color-primary)" />
                    <span>Cartão de Crédito em até 12x ou PIX Instantâneo</span>
                  </div>
                  <div className={styles.trustBadgeItem}>
                    <Zap size={18} color="#f59e0b" />
                    <span>Cancelamento sem custos até 2h antes</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}
