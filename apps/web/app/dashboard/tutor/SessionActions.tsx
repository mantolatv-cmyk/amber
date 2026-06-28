'use client';

import React, { useTransition } from 'react';
import { acceptSession, rejectSession } from './actions';
import { Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SessionActions({ sessionId }: { sessionId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleAccept = () => {
    startTransition(async () => {
      try {
        await acceptSession(sessionId);
        toast.success('Aula aceita com sucesso!');
      } catch (err: any) {
        toast.error(err.message || 'Erro ao aceitar aula.');
      }
    });
  };

  const handleReject = () => {
    if (!confirm('Tem certeza que deseja recusar esta aula?')) return;
    startTransition(async () => {
      try {
        await rejectSession(sessionId);
        toast.success('Aula recusada.');
      } catch (err: any) {
        toast.error(err.message || 'Erro ao recusar aula.');
      }
    });
  };

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button 
        className="btn btn--primary" 
        onClick={handleAccept} 
        disabled={isPending}
      >
        {isPending ? <Loader2 size={16} className="spin" /> : <Check size={16} />} 
        Aceitar
      </button>
      <button 
        className="btn btn--ghost" 
        onClick={handleReject} 
        disabled={isPending}
      >
        {isPending ? <Loader2 size={16} className="spin" /> : <X size={16} />} 
        Recusar
      </button>
    </div>
  );
}
