'use client';

import React, { useState } from 'react';
import { XCircle, Star, Loader2 } from 'lucide-react';
import { cancelSession, submitReview } from './actions';
import { toast } from 'sonner';

export function CancelButton({ sessionId }: { sessionId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleCancel = async () => {
    if (!confirm('Tem certeza que deseja cancelar esta aula?')) return;
    setIsLoading(true);
    try {
      const res = await cancelSession(sessionId);
      if (res?.success) {
        setDone(true);
        toast.success('Aula cancelada com sucesso.');
      } else {
        toast.error('Erro ao cancelar a aula.');
      }
    } catch (err) {
      toast.error('Erro ao cancelar a aula.');
    } finally {
      setIsLoading(false);
    }
  };

  if (done) return <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>Cancelada</span>;

  return (
    <button
      onClick={handleCancel}
      disabled={isLoading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-border)',
        background: 'white', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 500,
        color: 'var(--color-text-secondary)',
      }}
    >
      {isLoading ? <Loader2 size={16} className="spin" /> : <XCircle size={16} />} Cancelar
    </button>
  );
}

export function ReviewButton({ sessionId }: { sessionId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const res = await submitReview(sessionId, rating, comment);
      if (res?.success) {
        setDone(true);
        setIsOpen(false);
        toast.success('Avaliação enviada com sucesso!');
      } else {
        toast.error('Erro ao enviar avaliação.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar avaliação.');
    } finally {
      setIsLoading(false);
    }
  };

  if (done) return <span style={{ color: 'var(--color-success)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>✓ Avaliado</span>;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-border)',
          background: 'white', cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 500,
          color: 'var(--color-text-secondary)',
        }}
      >
        <Star size={16} /> Avaliar Tutor
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setIsOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: '16px', padding: '32px', width: '90%', maxWidth: '440px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <h3 style={{ marginBottom: '16px', fontWeight: 600 }}>Avaliar Tutor</h3>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setRating(n)} style={{
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '28px',
                  color: n <= rating ? 'var(--color-warning)' : '#ddd',
                }}>
                  ★
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Conte como foi sua experiência..."
              className="input"
              rows={3}
              style={{ marginBottom: '16px' }}
            />

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn--secondary" onClick={() => setIsOpen(false)}>Cancelar</button>
              <button className="btn btn--primary" onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? 'Enviando...' : 'Enviar Avaliação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
