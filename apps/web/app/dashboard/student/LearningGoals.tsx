'use client';

import React, { useState } from 'react';
import { Target, CheckCircle, Circle, Edit2, Plus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateLearningGoals } from './actions';
import styles from './student.module.css';

interface LearningGoalsProps {
  initialGoals: string[];
  completedCount: number;
}

export default function LearningGoals({ initialGoals, completedCount }: LearningGoalsProps) {
  const [goals, setGoals] = useState<string[]>(initialGoals);
  const [isEditing, setIsEditing] = useState(false);
  const [newGoal, setNewGoal] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAddGoal = () => {
    if (newGoal.trim()) {
      setGoals([...goals, newGoal.trim()]);
      setNewGoal('');
    }
  };

  const handleRemoveGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const res = await updateLearningGoals(goals);
    if (res.success) {
      toast.success('Objetivos atualizados!');
      setIsEditing(false);
    } else {
      toast.error(res.error || 'Erro ao salvar objetivos.');
    }
    setIsSaving(false);
  };

  if (!isEditing) {
    return (
      <div className={styles.card} style={{ marginTop: 'var(--space-6)' }}>
        <div className={styles.cardHeaderFlex}>
          <h3 className={styles.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={20} className={styles.titleIcon} /> Objetivos
          </h3>
          <button className={styles.textBtn} onClick={() => setIsEditing(true)}>
            <Edit2 size={14} style={{ marginRight: '4px' }}/> Editar
          </button>
        </div>
        <ul className={styles.goalList}>
          {goals.length === 0 ? (
            <li className={styles.goalItem} style={{ color: 'var(--color-text-tertiary)' }}>Nenhum objetivo definido.</li>
          ) : (
            goals.map((goal, idx) => (
              <li key={idx} className={`${styles.goalItem} ${idx === 0 && completedCount > 0 ? styles.goalCompleted : ''}`}>
                {idx === 0 && completedCount > 0
                  ? <CheckCircle size={18} className={styles.goalIcon} />
                  : <Circle size={18} className={styles.goalIcon} />
                }
                <span>{goal}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    );
  }

  return (
    <div className={styles.card} style={{ marginTop: 'var(--space-6)' }}>
      <div className={styles.cardHeaderFlex}>
        <h3 className={styles.cardTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Target size={20} className={styles.titleIcon} /> Editando Objetivos
        </h3>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
        {goals.map((goal, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-bg-subtle)', padding: '8px 12px', borderRadius: '6px' }}>
            <span style={{ flex: 1, fontSize: '14px' }}>{goal}</span>
            <button onClick={() => handleRemoveGoal(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }}>
              <X size={16} />
            </button>
          </div>
        ))}

        <div style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            className="input" 
            placeholder="Novo objetivo..." 
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddGoal() }}
            style={{ flex: 1 }}
          />
          <button className="btn btn--secondary" onClick={handleAddGoal}>
            <Plus size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
          <button className="btn btn--ghost" onClick={() => { setGoals(initialGoals); setIsEditing(false); }} disabled={isSaving}>
            Cancelar
          </button>
          <button className="btn btn--primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 size={16} className="spin" /> : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
