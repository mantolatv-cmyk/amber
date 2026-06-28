'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarCheck, MessageSquare, ShieldCheck, Clock, User, ArrowRight, Loader2 } from 'lucide-react';
import Header from '../../../components/Header/Header';
import styles from './book.module.css';

interface TutorInfo {
  name: string;
  hourlyRateCents: number;
  trialRateCents: number | null;
  currency: string;
}

interface AvailSlot {
  dayOfWeek: number;
  startTimeUtc: string;
  endTimeUtc: string;
}

const DAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function BookingPage({ params }: any) {
  const router = useRouter();
  const [tutorInfo, setTutorInfo] = useState<TutorInfo | null>(null);
  const [availSlots, setAvailSlots] = useState<AvailSlot[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isTrial, setIsTrial] = useState(true);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState('');

  // Fetch tutor info + availability
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/v1/tutors/${params.id}/availability`);
        const data = await res.json();
        if (data.success) {
          setTutorInfo(data.data.tutor);
          setAvailSlots(data.data.availability);
        }
      } catch (err) {
        console.error("Failed to load tutor data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  const timesForDay = availSlots
    .filter(s => s.dayOfWeek === selectedDay)
    .map(s => s.startTimeUtc.substring(0, 5));

  const priceCents = isTrial && tutorInfo?.trialRateCents
    ? tutorInfo.trialRateCents
    : (tutorInfo?.hourlyRateCents || 0);
  const priceFormatted = `R$ ${(priceCents / 100).toFixed(2)}`;

  // Compute next occurrence of the selected day+time
  const getNextScheduledDate = (): { start: Date; end: Date } | null => {
    if (selectedDay === null || !selectedTime) return null;
    const now = new Date();
    const today = now.getDay();
    let daysUntil = selectedDay - today;
    if (daysUntil <= 0) daysUntil += 7;
    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + daysUntil);
    const parts = selectedTime.split(':');
    const hours = Number(parts[0]) || 0;
    const minutes = Number(parts[1]) || 0;
    nextDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(nextDate.getTime() + 60 * 60 * 1000);
    return { start: nextDate, end: endDate };
  };

  const handleBooking = async () => {
    const schedule = getNextScheduledDate();
    if (!schedule) return;

    setIsBooking(true);
    setError('');

    try {
      const res = await fetch('/api/v1/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorId: params.id,
          scheduledStart: schedule.start.toISOString(),
          scheduledEnd: schedule.end.toISOString(),
          isTrial,
          notes,
        }),
      });

      const data = await res.json();

      if (data.success && data.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      } else {
        setError(data.message || 'Erro ao agendar aula.');
      }
    } catch {
      setError('Erro de conexão.');
    } finally {
      setIsBooking(false);
    }
  };

  const schedule = getNextScheduledDate();

  if (isLoading) {
    return (
      <>
        <Header variant="light" navLinks={[]} backLink={{ label: 'Voltar ao Perfil', href: `/tutor/${params.id}` }} />
        <main className={styles.bookingPage}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px', flexDirection: 'column', gap: '16px' }}>
            <Loader2 size={32} className="spin" color="var(--color-primary)" />
            <p>Carregando disponibilidade...</p>
          </div>
        </main>
      </>
    );
  }

  // Unique days that have availability
  const availableDays = [...new Set(availSlots.map(s => s.dayOfWeek))].sort();

  return (
    <>
      <Header variant="light" navLinks={[]} backLink={{ label: 'Voltar ao Perfil', href: `/tutor/${params.id}` }} />
      
      <main className={styles.bookingPage}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className="heading-2">Agendar Aula {isTrial ? 'Experimental' : 'Regular'}</h1>
            <p className="text-muted">Escolha o tipo de aula, dia e horário.</p>
          </div>

          <div className={styles.layout}>
            {/* Left Col: Selection */}
            <div className={styles.mainCol}>
              {/* Lesson Type */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarCheck size={20} className={styles.titleIcon} /> 1. Tipo de Aula
                </h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    className={`${styles.slotBtn} ${isTrial ? styles.slotActive : ''}`}
                    onClick={() => setIsTrial(true)}
                    style={{ flex: 1, padding: '16px' }}
                  >
                    <div className={styles.slotDate}>Experimental</div>
                    <div className={styles.slotTime}>
                      {tutorInfo?.trialRateCents ? `R$ ${(tutorInfo.trialRateCents / 100).toFixed(0)}` : 'Grátis'}
                    </div>
                  </button>
                  <button
                    className={`${styles.slotBtn} ${!isTrial ? styles.slotActive : ''}`}
                    onClick={() => setIsTrial(false)}
                    style={{ flex: 1, padding: '16px' }}
                  >
                    <div className={styles.slotDate}>Regular (60 min)</div>
                    <div className={styles.slotTime}>R$ {((tutorInfo?.hourlyRateCents || 0) / 100).toFixed(0)}</div>
                  </button>
                </div>
              </div>

              {/* Day Selection */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarCheck size={20} className={styles.titleIcon} /> 2. Escolha o dia
                </h3>
                <div className={styles.slotsGrid}>
                  {availableDays.length === 0 ? (
                    <p style={{ color: 'var(--color-text-secondary)' }}>Este tutor não possui horários disponíveis.</p>
                  ) : (
                    availableDays.map(day => (
                      <button
                        key={day}
                        className={`${styles.slotBtn} ${selectedDay === day ? styles.slotActive : ''}`}
                        onClick={() => { setSelectedDay(day); setSelectedTime(null); }}
                      >
                        <div className={styles.slotDate}>{DAY_LABELS[day]}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Time Selection */}
              {selectedDay !== null && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={20} className={styles.titleIcon} /> 3. Escolha o horário
                  </h3>
                  <div className={styles.slotsGrid}>
                    {timesForDay.map(time => (
                      <button
                        key={time}
                        className={`${styles.slotBtn} ${selectedTime === time ? styles.slotActive : ''}`}
                        onClick={() => setSelectedTime(time)}
                      >
                        <div className={styles.slotTime}>{time}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={20} className={styles.titleIcon} /> 4. Mensagem para o tutor (opcional)
                </h3>
                <textarea
                  className="input"
                  rows={4}
                  placeholder="O que você gostaria de aprender nesta aula?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Right Col: Summary */}
            <div className={styles.sideCol}>
              <div className={styles.summaryCard}>
                <h3 className={styles.summaryTitle}>Resumo do Agendamento</h3>
                
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}><Clock size={16} style={{marginRight: '6px', verticalAlign: 'text-bottom'}} /> Aula</span>
                  <span className={styles.summaryValue}>{isTrial ? 'Experimental' : 'Regular'} (60 min)</span>
                </div>
                
                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}><User size={16} style={{marginRight: '6px', verticalAlign: 'text-bottom'}} /> Tutor</span>
                  <span className={styles.summaryValue}>{tutorInfo?.name || '...'}</span>
                </div>

                {schedule && (
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryLabel}><CalendarCheck size={16} style={{marginRight: '6px', verticalAlign: 'text-bottom'}} /> Data</span>
                    <span className={styles.summaryValue}>
                      {schedule.start.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })} às {selectedTime}
                    </span>
                  </div>
                )}

                <hr className={styles.divider} />

                <div className={styles.summaryRow}>
                  <span className={styles.summaryLabel}>Total</span>
                  <span className={styles.summaryTotal}>{priceFormatted}</span>
                </div>

                {error && <div className={styles.errorBox}>{error}</div>}

                <button 
                  className={`btn btn--primary ${styles.confirmBtn}`}
                  disabled={selectedDay === null || !selectedTime || isBooking}
                  onClick={handleBooking}
                >
                  {isBooking ? 'Processando...' : <>Confirmar Agendamento <ArrowRight size={16} /></>}
                </button>

                <p className={styles.guaranteeText}>
                  <ShieldCheck size={16} style={{display: 'inline-block', verticalAlign: 'text-bottom', marginRight: '4px'}} /> Pagamento 100% seguro. O tutor só recebe o valor após a confirmação da aula.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
