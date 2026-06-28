'use client';

import React, { useState } from 'react';
import { Calendar, Clock, Plus, Trash2, CalendarCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { saveWeeklyAvailability, addTimeOff, removeTimeOff, addExtraSlot, removeExtraSlot, manualBookSession } from './actions';

type Tab = 'agenda' | 'weekly' | 'exceptions' | 'manual';

const DAYS_OF_WEEK = [
  'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
];

interface ScheduleManagerProps {
  tutorId: string;
  availability: any[];
  timeOffs: any[];
  pastStudents: any[];
  subjects: any[];
  upcomingSessions: any[];
}

export default function ScheduleManager({ tutorId, availability, timeOffs, pastStudents, subjects, upcomingSessions }: ScheduleManagerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('agenda');

  return (
    <div style={{ background: 'var(--color-bg)', borderRadius: '12px', border: '1px solid var(--color-border-subtle)', overflow: 'hidden' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-subtle)' }}>
        <button 
          onClick={() => setActiveTab('agenda')}
          style={{ flex: 1, padding: '16px', background: 'none', border: 'none', borderBottom: activeTab === 'agenda' ? '2px solid var(--color-primary)' : '2px solid transparent', fontWeight: activeTab === 'agenda' ? 600 : 400, color: activeTab === 'agenda' ? 'var(--color-text)' : 'var(--color-text-secondary)', cursor: 'pointer' }}
        >
          Agenda
        </button>
        <button 
          onClick={() => setActiveTab('weekly')}
          style={{ flex: 1, padding: '16px', background: 'none', border: 'none', borderBottom: activeTab === 'weekly' ? '2px solid var(--color-primary)' : '2px solid transparent', fontWeight: activeTab === 'weekly' ? 600 : 400, color: activeTab === 'weekly' ? 'var(--color-text)' : 'var(--color-text-secondary)', cursor: 'pointer' }}
        >
          Disponibilidade Semanal
        </button>
        <button 
          onClick={() => setActiveTab('exceptions')}
          style={{ flex: 1, padding: '16px', background: 'none', border: 'none', borderBottom: activeTab === 'exceptions' ? '2px solid var(--color-primary)' : '2px solid transparent', fontWeight: activeTab === 'exceptions' ? 600 : 400, color: activeTab === 'exceptions' ? 'var(--color-text)' : 'var(--color-text-secondary)', cursor: 'pointer' }}
        >
          Folgas & Exceções
        </button>
        <button 
          onClick={() => setActiveTab('manual')}
          style={{ flex: 1, padding: '16px', background: 'none', border: 'none', borderBottom: activeTab === 'manual' ? '2px solid var(--color-primary)' : '2px solid transparent', fontWeight: activeTab === 'manual' ? 600 : 400, color: activeTab === 'manual' ? 'var(--color-text)' : 'var(--color-text-secondary)', cursor: 'pointer' }}
        >
          Agendar Aula Manual
        </button>
      </div>

      <div style={{ padding: '24px' }}>
        {activeTab === 'agenda' && <AgendaTab sessions={upcomingSessions} />}
        {activeTab === 'weekly' && <WeeklyTab initialAvailability={availability.filter(a => a.isRecurring)} />}
        {activeTab === 'exceptions' && <ExceptionsTab timeOffs={timeOffs} extraSlots={availability.filter(a => !a.isRecurring)} />}
        {activeTab === 'manual' && <ManualBookingTab pastStudents={pastStudents} subjects={subjects} />}
      </div>
    </div>
  );
}

// ==========================================
// Tab 0: Agenda
// ==========================================
function AgendaTab({ sessions }: { sessions: any[] }) {
  if (sessions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', background: 'var(--color-bg-subtle)', borderRadius: '12px' }}>
        <CalendarCheck size={48} color="var(--color-text-tertiary)" style={{ marginBottom: '16px' }} />
        <h3 style={{ fontSize: '18px', fontWeight: 600 }}>Sua agenda está livre</h3>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px' }}>Não há aulas marcadas para os próximos dias.</p>
      </div>
    );
  }

  // Group sessions by date
  const grouped = sessions.reduce((acc: any, s: any) => {
    const d = new Date(s.scheduledStart).toLocaleDateString('pt-BR');
    if (!acc[d]) acc[d] = [];
    acc[d].push(s);
    return acc;
  }, {});

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px' }}>Suas Próximas Aulas</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {Object.keys(grouped).map(dateStr => (
          <div key={dateStr}>
            <div style={{ fontWeight: 600, color: 'var(--color-primary)', borderBottom: '2px solid var(--color-primary-100)', paddingBottom: '8px', marginBottom: '16px' }}>
              {dateStr}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {grouped[dateStr].map((s: any) => {
                const isPending = s.status === 'pending_confirmation';
                return (
                  <div key={s.id} style={{ display: 'flex', padding: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-subtle)', padding: '12px', borderRadius: '8px', minWidth: '80px' }}>
                      <span style={{ fontWeight: 600, fontSize: '16px' }}>{new Date(s.scheduledStart).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{s.durationMinutes} min</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ fontWeight: 600, margin: '0 0 4px 0' }}>{s.student.fullName}</h4>
                        {isPending && <span style={{ background: 'var(--color-warning-bg)', color: '#B8860B', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>Pendente</span>}
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>{s.subject.name}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// Tab 1: Weekly
// ==========================================
function WeeklyTab({ initialAvailability }: { initialAvailability: any[] }) {
  const [schedule, setSchedule] = useState(() => {
    const s = Array.from({ length: 7 }, () => [] as { start: string, end: string }[]);
    initialAvailability.forEach(a => {
      s[a.dayOfWeek]?.push({ start: a.startTimeUtc, end: a.endTimeUtc });
    });
    return s;
  });
  const [isSaving, setIsSaving] = useState(false);

  const addSlot = (day: number) => {
    const newSchedule = [...schedule];
    if (newSchedule[day]) newSchedule[day].push({ start: '09:00', end: '17:00' });
    setSchedule(newSchedule);
  };

  const updateSlot = (day: number, index: number, field: 'start'|'end', val: string) => {
    const newSchedule = [...schedule];
    if (newSchedule[day] && newSchedule[day][index]) {
      newSchedule[day][index][field] = val;
    }
    setSchedule(newSchedule);
  };

  const removeSlot = (day: number, index: number) => {
    const newSchedule = [...schedule];
    if (newSchedule[day]) newSchedule[day].splice(index, 1);
    setSchedule(newSchedule);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const flat = [];
    for (let d = 0; d < 7; d++) {
      for (const slot of schedule[d] || []) {
        flat.push({ dayOfWeek: d, startTimeUtc: slot.start, endTimeUtc: slot.end });
      }
    }
    const res = await saveWeeklyAvailability(flat);
    if (res.success) toast.success('Disponibilidade salva!');
    else toast.error(res.error);
    setIsSaving(false);
  };

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Horários Padrão</h2>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
        Estes horários se repetem toda semana. Alunos só podem agendar dentro dessas janelas.
      </p>

      {DAYS_OF_WEEK.map((dayName, dayIndex) => (
        <div key={dayIndex} style={{ display: 'flex', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border-subtle)', padding: '16px 0' }}>
          <div style={{ width: '120px', fontWeight: 500, paddingTop: '8px' }}>{dayName}</div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(!schedule[dayIndex] || schedule[dayIndex].length === 0) ? (
              <div style={{ color: 'var(--color-text-tertiary)', fontSize: '14px', paddingTop: '8px' }}>Indisponível</div>
            ) : (
              (schedule[dayIndex] || []).map((slot, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="time" className="input" value={slot.start} onChange={e => updateSlot(dayIndex, i, 'start', e.target.value)} />
                  <span>até</span>
                  <input type="time" className="input" value={slot.end} onChange={e => updateSlot(dayIndex, i, 'end', e.target.value)} />
                  <button onClick={() => removeSlot(dayIndex, i)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '8px' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
            <button onClick={() => addSlot(dayIndex)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '14px', fontWeight: 500, alignSelf: 'flex-start', marginTop: '4px' }}>
              <Plus size={16} /> Adicionar Horário
            </button>
          </div>
        </div>
      ))}

      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn--primary" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 size={16} className="spin" /> : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  );
}

// ==========================================
// Tab 2: Exceptions
// ==========================================
function ExceptionsTab({ timeOffs, extraSlots }: { timeOffs: any[], extraSlots: any[] }) {
  // Simple form for adding a time off
  const [startOff, setStartOff] = useState('');
  const [endOff, setEndOff] = useState('');
  const [reason, setReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAddTimeOff = async () => {
    if (!startOff || !endOff) return toast.error('Preencha as datas.');
    setIsSaving(true);
    const res = await addTimeOff(new Date(startOff), new Date(endOff), reason);
    if (res.success) {
      toast.success('Folga adicionada!');
      setStartOff(''); setEndOff(''); setReason('');
    } else toast.error(res.error);
    setIsSaving(false);
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remover?')) return;
    await removeTimeOff(id);
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '32px' }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Adicionar Férias / Ausência</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label className="label">Início</label>
              <input type="datetime-local" className="input" value={startOff} onChange={e => setStartOff(e.target.value)} />
            </div>
            <div>
              <label className="label">Fim</label>
              <input type="datetime-local" className="input" value={endOff} onChange={e => setEndOff(e.target.value)} />
            </div>
            <div>
              <label className="label">Motivo (Opcional)</label>
              <input type="text" className="input" placeholder="Ex: Férias, Médico..." value={reason} onChange={e => setReason(e.target.value)} />
            </div>
            <button className="btn btn--primary" onClick={handleAddTimeOff} disabled={isSaving}>
              Bloquear Agenda
            </button>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Suas Folgas Programadas</h2>
          {timeOffs.length === 0 ? <p style={{ fontSize: '14px', color: 'var(--color-text-tertiary)' }}>Nenhuma folga marcada.</p> : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {timeOffs.map(t => (
                <li key={t.id} style={{ display: 'flex', justifyContent: 'space-between', background: 'var(--color-bg-subtle)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border-subtle)' }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '14px' }}>{t.reason || 'Ausência'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      De {new Date(t.startTime).toLocaleDateString()} até {new Date(t.endTime).toLocaleDateString()}
                    </div>
                  </div>
                  <button onClick={() => handleRemove(t.id)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Tab 3: Manual Booking
// ==========================================
function ManualBookingTab({ pastStudents, subjects }: { pastStudents: any[], subjects: any[] }) {
  const [studentId, setStudentId] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [subjectId, setSubjectId] = useState(subjects.length > 0 ? subjects[0].id : '');
  const [isSaving, setIsSaving] = useState(false);

  const handleBook = async () => {
    if (!studentId || !start || !end || !subjectId) return toast.error('Preencha todos os campos obrigatórios.');
    setIsSaving(true);
    const res = await manualBookSession(studentId, new Date(start), new Date(end), subjectId);
    if (res.success) {
      toast.success('Aula agendada e confirmada!');
      setStart(''); setEnd('');
    } else {
      toast.error(res.error);
    }
    setIsSaving(false);
  };

  return (
    <div style={{ maxWidth: '500px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Agendamento Manual</h2>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
        Agende uma aula diretamente com alunos que você já ensinou. A aula nascerá com status "Confirmado", útil para quando o pagamento ocorreu fora da plataforma.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label className="label">Aluno</label>
          <select className="input" value={studentId} onChange={e => setStudentId(e.target.value)}>
            <option value="">-- Selecione o Aluno --</option>
            {pastStudents.map(s => (
              <option key={s.id} value={s.id}>{s.fullName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Matéria</label>
          <select className="input" value={subjectId} onChange={e => setSubjectId(e.target.value)}>
            <option value="">-- Selecione a Matéria --</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Início da Aula</label>
          <input type="datetime-local" className="input" value={start} onChange={e => setStart(e.target.value)} />
        </div>
        <div>
          <label className="label">Fim da Aula</label>
          <input type="datetime-local" className="input" value={end} onChange={e => setEnd(e.target.value)} />
        </div>

        <button className="btn btn--primary" style={{ marginTop: '16px' }} onClick={handleBook} disabled={isSaving || pastStudents.length === 0}>
          {isSaving ? <Loader2 size={16} className="spin" /> : 'Confirmar Aula Manual'}
        </button>
      </div>
    </div>
  );
}
