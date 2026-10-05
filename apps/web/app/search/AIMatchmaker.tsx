'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  CheckCircle2, 
  Star, 
  Calendar, 
  User, 
  ArrowRight, 
  Compass, 
  Zap, 
  X,
  Target
} from 'lucide-react';
import styles from './AIMatchmaker.module.css';

interface MatchTutor {
  id: string;
  name: string;
  headline: string;
  hourlyRateCents: number;
  trialRateCents: number | null;
  avgRating: number;
  matchPercentage: number;
  matchReason: string;
  learningRoadmap: string[];
}

interface MatchResponse {
  matches: MatchTutor[];
  analysis: {
    prompt: string;
    identifiedGoal: string;
    recommendedLevel: string;
    keywords: string[];
  };
}

const QUICK_PROMPTS = [
  "Quero criar um agente com LangChain e banco vetorial",
  "Preparação para entrevista técnica de IA",
  "Aprender Python e IA do absoluto zero",
  "Fine-tuning de modelos abertos com LoRA"
];

export default function AIMatchmaker({
  onApplyFilter
}: {
  onApplyFilter?: (searchTerm: string) => void;
}) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [matchData, setMatchData] = useState<MatchResponse | null>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/tutors/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setMatchData(json.data);
      }
    } catch (err) {
      console.error('Failed to match tutors with AI:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectQuickPrompt = (text: string) => {
    setPrompt(text);
  };

  return (
    <div className={styles.matchmakerCard}>
      <div className={styles.cardGlow} />

      {/* Top Header */}
      <div className={styles.topRow}>
        <div className={styles.aiBadge}>
          <Sparkles size={14} /> Matchmaker Inteligente com IA
        </div>
        {matchData && (
          <button 
            type="button" 
            className="btn btn--ghost btn--sm" 
            onClick={() => setMatchData(null)}
            style={{ fontSize: '12px' }}
          >
            <X size={14} /> Fechar recomendações
          </button>
        )}
      </div>

      <h2 className={styles.heading}>Qual projeto ou habilidade de IA você deseja desenvolver?</h2>
      <p className={styles.description}>
        Descreva sua meta ou selecione uma sugestão abaixo. Nossa IA analisa a especialidade, metodologia e disponibilidade dos tutores para indicar os melhores mentores para o seu objetivo.
      </p>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className={styles.promptForm}>
        <input
          type="text"
          className={styles.promptInput}
          placeholder="Ex: Quero implementar um pipeline de RAG com LangChain e ChromaDB em Python para documentos jurídicos..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={!prompt.trim() || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="spin" /> Analisando...
            </>
          ) : (
            <>
              <Sparkles size={16} /> Encontrar Tutores Ideais
            </>
          )}
        </button>
      </form>

      {/* Quick Prompts */}
      <div className={styles.quickWrap}>
        <span className={styles.quickLabel}>Sugestões rápidas:</span>
        {QUICK_PROMPTS.map((qp) => (
          <button
            key={qp}
            type="button"
            className={styles.quickChip}
            onClick={() => handleSelectQuickPrompt(qp)}
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Loading Animation */}
      {isLoading && (
        <div className={styles.loadingBox}>
          <Loader2 size={24} className="spin" />
          <span>Analisando metodologias de ensino, compatibilidade e histórico de mentorias...</span>
        </div>
      )}

      {/* Results View */}
      {matchData && !isLoading && (
        <div className={styles.resultsContainer}>
          <div className={styles.resultsHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className={styles.goalBadge}>
                <Target size={14} /> {matchData.analysis.identifiedGoal}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                Nível sugerido: <strong>{matchData.analysis.recommendedLevel}</strong>
              </span>
            </div>
            {onApplyFilter && matchData.analysis.keywords.length > 0 && (
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                style={{ fontSize: '12px' }}
                onClick={() => onApplyFilter(matchData.analysis.keywords[0])}
              >
                Filtrar catálogo com este foco
              </button>
            )}
          </div>

          <div className={styles.matchesGrid}>
            {matchData.matches.map((tutor) => {
              const initials = tutor.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
              const priceFormatted = `R$ ${(tutor.hourlyRateCents / 100).toFixed(0)}/h`;
              const trialFormatted = tutor.trialRateCents ? `R$ ${(tutor.trialRateCents / 100).toFixed(0)}` : 'Grátis';

              return (
                <div key={tutor.id} className={styles.matchCard}>
                  <div>
                    <div className={styles.cardTop}>
                      <span className={styles.matchScore}>
                        <Zap size={12} /> {tutor.matchPercentage}% Match
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Star size={13} fill="currentColor" /> {tutor.avgRating.toFixed(1)}
                      </span>
                    </div>

                    <div className={styles.tutorIdentity}>
                      <div className={styles.avatar}>{initials}</div>
                      <div>
                        <div className={styles.tutorName}>{tutor.name}</div>
                        <div className={styles.tutorHeadline}>{tutor.headline}</div>
                      </div>
                    </div>

                    {/* Por que é ideal */}
                    <div className={styles.reasonBox}>
                      <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: '2px' }}>
                        Por que é ideal para seu objetivo:
                      </strong>
                      {tutor.matchReason}
                    </div>

                    {/* Trilha recomendada */}
                    <div style={{ marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                        Plano sugerido para a aula:
                      </span>
                      <ul className={styles.roadmapList} style={{ marginTop: '6px' }}>
                        {tutor.learningRoadmap.map((step, idx) => (
                          <li key={idx} className={styles.roadmapItem}>
                            <CheckCircle2 size={13} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <div className={styles.priceRow}>
                      <span>Aula Experimental: <strong>{trialFormatted}</strong></span>
                      <span className={styles.priceValue}>{priceFormatted}</span>
                    </div>

                    <div className={styles.actionsRow}>
                      <Link 
                        href={`/tutor/${tutor.id}/book?notes=${encodeURIComponent(matchData.analysis.prompt)}`}
                        className={styles.bookBtn}
                      >
                        <Calendar size={14} /> Agendar Aula
                      </Link>
                      <Link 
                        href={`/tutor/${tutor.id}`}
                        className={styles.profileBtn}
                      >
                        Ver Perfil
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
