'use client';

import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Loader2, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function StripeOnboardingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/stripe/connect', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Erro ao conectar com a Stripe.');
        setIsLoading(false);
      }
    } catch (err) {
      toast.error('Erro de conexão.');
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ 
        background: 'var(--color-surface)', 
        border: '1px solid var(--color-border)', 
        borderRadius: '16px', 
        padding: '32px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '32px', 
          background: 'rgba(108, 92, 231, 0.1)', color: 'var(--color-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <DollarSign size={32} />
        </div>
        
        <h1 className="heading-3" style={{ marginBottom: '16px' }}>Receba seus pagamentos</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px', lineHeight: 1.6 }}>
          A OpenLearn usa a <strong>Stripe</strong> para processar pagamentos com segurança. 
          Para receber pelas suas aulas, você precisa conectar ou criar uma conta Stripe Express.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-primary)' }}>
            <ShieldCheck size={20} color="var(--color-success)" /> Repasses automáticos
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-primary)' }}>
            <ShieldCheck size={20} color="var(--color-success)" /> 100% seguro
          </div>
        </div>

        <button 
          onClick={handleConnect}
          disabled={isLoading}
          className="btn btn--primary" 
          style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}
        >
          {isLoading ? (
            <>Processando... <Loader2 size={20} className="spin" /></>
          ) : (
            <>Conectar com Stripe <ArrowRight size={20} /></>
          )}
        </button>
      </div>
    </div>
  );
}
