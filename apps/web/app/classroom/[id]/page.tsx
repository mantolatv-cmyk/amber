'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Camera, 
  Code2, 
  Columns, 
  PanelRightClose, 
  PanelRightOpen, 
  Loader2, 
  CheckCircle, 
  Copy, 
  Check, 
  RotateCcw, 
  Send, 
  Star, 
  LogOut, 
  FileText, 
  MessageSquare,
  AlertCircle,
  X
} from 'lucide-react';
import DailyIframe from '@daily-co/daily-js';
import { toast } from 'sonner';
import { 
  fetchClassroomData, 
  saveSessionNotes, 
  completeClassroomSession, 
  submitClassroomReview 
} from './actions';
import styles from './classroom.module.css';

const CODE_TEMPLATES: Record<string, { name: string; lang: string; code: string }> = {
  python: {
    name: 'script.py',
    lang: 'Python',
    code: `# Exemplo de Integração com OpenAI / LLM
import os
from openai import OpenAI

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

def generate_response(prompt: str) -> str:
    """Gera uma resposta usando o modelo GPT-4o."""
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "Você é um tutor especialista da OpenLearn."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7
    )
    return response.choices[0].message.content

if __name__ == "__main__":
    pergunta = "Explique RAG (Retrieval-Augmented Generation) em 3 tópicos."
    resposta = generate_response(pergunta)
    print(resposta)
`
  },
  javascript: {
    name: 'agent.js',
    lang: 'JavaScript',
    code: `// Chamada de API com Streaming em Node / Browser
async function streamAICompletion(prompt) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": \`Bearer \${process.env.OPENAI_API_KEY}\`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      stream: true
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    console.log(chunk);
  }
}
`
  },
  prompt: {
    name: 'prompt_template.md',
    lang: 'Prompt (Markdown)',
    code: `# Sistema de Prompts Avançado (Framework CRISPE)

## 1. Contexto (Context)
Você é um desenvolvedor sênior especialista em Arquiteturas RAG e Engenharia de Prompts na plataforma OpenLearn.

## 2. Papel (Role)
Atue como um arquiteto de software revisando um pipeline de embeddings.

## 3. Instrução (Instruction)
Analise o trecho de código abaixo e aponte:
1. Gargalos de latência na busca vetorial.
2. Risco de alucinação por contexto insuficiente.
3. Sugestão de re-ranking (Cross-Encoder vs Cohere).

## 4. Restrições (Constraints)
- Responda em Português (pt-BR).
- Seja conciso e use bullet points.
- Inclua exemplos de código práticos.
`
  },
  sql: {
    name: 'vector_search.sql',
    lang: 'PostgreSQL (pgvector)',
    code: `-- Busca por similaridade de cosseno usando pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela de documentos com embeddings de 1536 dimensões
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consulta de vizinhos mais próximos (Cosine Similarity)
SELECT 
    id,
    content,
    1 - (embedding <=> $1) AS similarity_score
FROM document_chunks
WHERE 1 - (embedding <=> $1) > 0.75
ORDER BY embedding <=> $1 ASC
LIMIT 5;
`
  }
};

const REVIEW_TAGS = [
  'Didática Excelente',
  'Exemplos Práticos',
  'Muita Paciência',
  'Expert em IA',
  'Pontualidade',
  'Código Limpo',
  'Resolução Rápida'
];

export default function ClassroomPage({ params }: any) {
  const router = useRouter();
  const unwrappedParams = typeof params?.then === 'function' ? use(params) : params;
  const sessionId = unwrappedParams?.id;

  const [activeTab, setActiveTab] = useState<'chat' | 'notes'>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mainView, setMainView] = useState<'video' | 'code' | 'split'>('split');
  const [sessionData, setSessionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timerText, setTimerText] = useState('00:00:00');
  
  // Interactive Code Editor State
  const [selectedLang, setSelectedLang] = useState<string>('python');
  const [codeContent, setCodeContent] = useState<string>(CODE_TEMPLATES.python!.code);
  const [copiedCode, setCopiedCode] = useState(false);

  // Chat & Notes State
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Session Completion & Review Modals State
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [selectedReviewTags, setSelectedReviewTags] = useState<string[]>([]);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const callRef = useRef<HTMLDivElement>(null);
  const callFrameRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Initial Data Fetch
  useEffect(() => {
    if (!sessionId) return;
    const loadData = async () => {
      try {
        const res = await fetchClassroomData(sessionId);
        if (res.success) {
          setSessionData(res.data);
          setNotes(res.data.notes || '');
          if (res.data.status === 'completed' && res.data.isStudent && !res.data.hasReviewed) {
            setIsReviewModalOpen(true);
          }
        }
      } catch (err) {
        console.error("Failed to load session", err);
        toast.error("Erro ao carregar os dados da sala virtual.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [sessionId]);

  // Daily.co iframe setup
  useEffect(() => {
    if (sessionData?.dailyRoomUrl && callRef.current && !callFrameRef.current) {
      callFrameRef.current = DailyIframe.createFrame(callRef.current, {
        showLeaveButton: true,
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: '0',
          borderRadius: '16px',
        }
      });
      callFrameRef.current.join({ url: sessionData.dailyRoomUrl });
    }

    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.leave();
        callFrameRef.current.destroy();
        callFrameRef.current = null;
      }
    };
  }, [sessionData?.dailyRoomUrl]);

  // Timer logic
  useEffect(() => {
    if (!sessionData?.scheduledStart) return;
    const start = new Date(sessionData.scheduledStart).getTime();
    
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = now - start;
      if (diff < 0) {
        setTimerText('Inicia em breve');
      } else {
        const h = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
        const m = Math.floor((diff / (1000 * 60)) % 60).toString().padStart(2, '0');
        const s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
        setTimerText(`${h}:${m}:${s}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionData?.scheduledStart]);

  // Chat Polling
  useEffect(() => {
    if (!sessionData?.otherUserId) return;
    const fetchMsgs = async () => {
      try {
        const res = await fetch(`/api/v1/messages?contactId=${sessionData.otherUserId}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setMessages(data.data);
        }
      } catch (err) {}
    };
    fetchMsgs();
    const interval = setInterval(fetchMsgs, 3000);
    return () => clearInterval(interval);
  }, [sessionData?.otherUserId]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!msgInput.trim() || !sessionData) return;
    
    const content = msgInput;
    setMsgInput('');
    
    const optimisticMsg = {
      id: Date.now().toString(),
      content,
      senderId: sessionData.currentUserId,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    try {
      await fetch('/api/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: sessionData.otherUserId,
          content
        })
      });
    } catch (err) {
      console.error('Error sending message');
      toast.error('Erro ao enviar mensagem.');
    }
  };

  // Notes Autosave
  useEffect(() => {
    if (!sessionData || notes === sessionData.notes || !sessionId) return;
    setSavingNotes(true);
    const timeout = setTimeout(async () => {
      try {
        await saveSessionNotes(sessionId, notes);
        setSessionData((prev: any) => ({ ...prev, notes }));
      } catch (err) {}
      setSavingNotes(false);
    }, 1200);
    return () => clearTimeout(timeout);
  }, [notes, sessionData, sessionId]);

  // Sync scrolling between code textarea and line numbers
  const handleCodeScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Switch code language
  const handleLanguageChange = (lang: string) => {
    setSelectedLang(lang);
    if (CODE_TEMPLATES[lang]) {
      setCodeContent(CODE_TEMPLATES[lang].code);
    }
  };

  // Copy code to clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
      setCopiedCode(true);
      toast.success("Código copiado para a área de transferência!");
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      toast.error("Não foi possível copiar o código.");
    }
  };

  // Finish session handler
  const handleConfirmFinishSession = async () => {
    if (!sessionId) return;
    setIsFinishing(true);
    try {
      const res = await completeClassroomSession(sessionId);
      if (res.success) {
        setSessionData((prev: any) => ({ ...prev, status: 'completed' }));
        setIsFinishModalOpen(false);
        toast.success("Aula finalizada com sucesso!");

        if (res.isStudent) {
          setIsReviewModalOpen(true);
        } else {
          router.push('/dashboard/tutor');
        }
      }
    } catch (err: any) {
      console.error("Failed to complete session", err);
      toast.error(err.message || "Erro ao finalizar aula.");
    } finally {
      setIsFinishing(false);
    }
  };

  // Review tag toggle
  const toggleReviewTag = (tag: string) => {
    setSelectedReviewTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Submit review
  const handleSubmitReview = async () => {
    if (!sessionId) return;
    setIsSubmittingReview(true);
    try {
      const finalComment = selectedReviewTags.length > 0
        ? `${selectedReviewTags.join(' • ')}${reviewComment ? `\n\n${reviewComment}` : ''}`
        : reviewComment;

      await submitClassroomReview(sessionId, reviewRating, finalComment);
      toast.success("Obrigado pela sua avaliação!");
      setIsReviewModalOpen(false);
      router.push('/dashboard/student');
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar avaliação.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const lineCount = Math.max(1, codeContent.split('\n').length);
  const currentTemplate = CODE_TEMPLATES[selectedLang] || CODE_TEMPLATES.python!;

  return (
    <div className={styles.classroomWrapper}>
      {/* Header da Sala de Aula */}
      <header className={styles.classHeader}>
        <div className={styles.headerLeft}>
          <Link 
            href={sessionData?.isStudent ? '/dashboard/student' : '/dashboard/tutor'} 
            className={styles.backBtn}
          >
            <LogOut size={16} /> Painel
          </Link>

          <div className={styles.classTitle}>
            {sessionData?.status === 'completed' ? (
              <span className={styles.completedBadge}>CONCLUÍDA</span>
            ) : (
              <span className={styles.liveBadge}>AO VIVO</span>
            )}
            <h2 className={styles.subjectHeading}>
              {sessionData ? sessionData.subjectName : "Carregando..."}
            </h2>
            {sessionData?.otherPersonName && (
              <span className={styles.participantTag}>
                com {sessionData.otherPersonName}
              </span>
            )}
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.timerBadge}>
            <span className={styles.timerDot} />
            {timerText}
          </div>

          {sessionData?.status !== 'completed' && (
            <button 
              className={styles.finishSessionBtn}
              onClick={() => setIsFinishModalOpen(true)}
            >
              <CheckCircle size={15} /> Finalizar Aula
            </button>
          )}

          <button 
            className={styles.toggleSidebarBtn}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? "Ocultar painel lateral" : "Abrir painel lateral"}
          >
            {isSidebarOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
          </button>
        </div>
      </header>

      {/* Área Principal de Trabalho */}
      <main className={styles.mainArea}>
        <section className={styles.centerSection}>
          {/* Toggles de Visualização */}
          <div className={styles.viewToggles}>
            <button 
              className={`${styles.viewToggleBtn} ${mainView === 'video' ? styles.viewToggleActive : ''}`}
              onClick={() => setMainView('video')}
            >
              <Camera size={14} /> Somente Câmera
            </button>
            <button 
              className={`${styles.viewToggleBtn} ${mainView === 'split' ? styles.viewToggleActive : ''}`}
              onClick={() => setMainView('split')}
            >
              <Columns size={14} /> Dividir Tela
            </button>
            <button 
              className={`${styles.viewToggleBtn} ${mainView === 'code' ? styles.viewToggleActive : ''}`}
              onClick={() => setMainView('code')}
            >
              <Code2 size={14} /> Editor de Código
            </button>
          </div>

          <div className={`${styles.workspaceArea} ${styles[`workspace-${mainView}`]}`}>
            {/* Bloco de Vídeo Daily.co */}
            {(mainView === 'video' || mainView === 'split') && (
              <div className={styles.videoWorkspace}>
                <div className={styles.videoPlaceholder}>
                  {isLoading ? (
                    <div className={styles.videoLoading}>
                      <Loader2 size={36} className={styles.spin} />
                      <p>Conectando à sala virtual privada...</p>
                    </div>
                  ) : sessionData?.dailyRoomUrl ? (
                    <div ref={callRef} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <div className={styles.videoUnavailable}>
                      <AlertCircle size={32} />
                      <p>Sala de vídeo não gerada para esta sessão.</p>
                      <span className={styles.sessionStatusSub}>Status: {sessionData?.status}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Editor de Código / Prompt Interativo */}
            {(mainView === 'code' || mainView === 'split') && (
              <div className={styles.codeWorkspace}>
                {/* Header do Editor */}
                <div className={styles.codeEditorHeader}>
                  <div className={styles.codeHeaderLeft}>
                    <Code2 size={16} className={styles.codeIcon} />
                    <span className={styles.codeFileName}>{currentTemplate.name}</span>
                    
                    {/* Seletor de Linguagem */}
                    <select
                      className={styles.codeLangSelect}
                      value={selectedLang}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                    >
                      <option value="python">Python (OpenAI / LangChain)</option>
                      <option value="javascript">JavaScript / Node</option>
                      <option value="prompt">Prompt Engineering</option>
                      <option value="sql">SQL / pgvector</option>
                    </select>
                  </div>

                  <div className={styles.codeHeaderRight}>
                    <button 
                      className={styles.codeActionBtn} 
                      onClick={() => setCodeContent(currentTemplate.code)}
                      title="Restaurar template original"
                    >
                      <RotateCcw size={13} /> Resetar
                    </button>
                    <button 
                      className={styles.codeActionBtn} 
                      onClick={handleCopyCode}
                      title="Copiar código"
                    >
                      {copiedCode ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                      {copiedCode ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>

                {/* Corpo do Editor de Código */}
                <div className={styles.codeEditorBody}>
                  {/* Números de Linha Sincronizados */}
                  <div ref={lineNumbersRef} className={styles.codeLineNumbers}>
                    {Array.from({ length: lineCount }).map((_, i) => (
                      <span key={i}>{i + 1}</span>
                    ))}
                  </div>

                  {/* Textarea Interativo */}
                  <textarea
                    ref={textareaRef}
                    className={styles.codeTextarea}
                    value={codeContent}
                    onChange={(e) => setCodeContent(e.target.value)}
                    onScroll={handleCodeScroll}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoComplete="off"
                    placeholder="Escreva ou cole seu código ou prompt aqui..."
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Sidebar com Chat e Bloco de Notas */}
        <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
          <div className={styles.sidebarTabs}>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'chat' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <MessageSquare size={15} /> Chat da Aula
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'notes' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              <FileText size={15} /> Anotações
              {savingNotes && <span className={styles.notesSavingBadge}>salvando...</span>}
            </button>
          </div>

          <div className={styles.sidebarContent}>
            {/* Aba do Chat */}
            {activeTab === 'chat' && (
              <div className={styles.chatArea}>
                <div className={styles.messagesList}>
                  {messages.length === 0 ? (
                    <div className={styles.chatEmptyState}>
                      <MessageSquare size={28} />
                      <p>Nenhuma mensagem ainda.</p>
                      <span>Envie dúvidas, links ou trechos de código aqui!</span>
                    </div>
                  ) : (
                    messages.map((m: any) => {
                      const isSelf = m.senderId === sessionData?.currentUserId;
                      return (
                        <div 
                          key={m.id} 
                          className={`${styles.message} ${isSelf ? styles.messageSelf : styles.messageOther}`}
                        >
                          <span className={styles.messageSender}>
                            {isSelf ? 'Você' : sessionData?.otherPersonName}
                          </span>
                          <div className={styles.messageBubble}>
                            {m.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className={styles.chatInputForm}>
                  <input
                    type="text"
                    className={styles.chatInput}
                    placeholder="Digite uma mensagem..."
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    className={styles.chatSendBtn}
                    disabled={!msgInput.trim()}
                  >
                    <Send size={15} />
                  </button>
                </form>
              </div>
            )}

            {/* Aba de Anotações (Autosave) */}
            {activeTab === 'notes' && (
              <div className={styles.notesArea}>
                <p className={styles.notesHelp}>
                  Suas anotações são salvas automaticamente no banco e ficam disponíveis no seu painel.
                </p>
                <textarea
                  className={styles.notesTextarea}
                  placeholder="Escreva aqui seus insights, links úteis e resumos desta sessão de aprendizado..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* Modal: Confirmar Finalização da Aula */}
      {isFinishModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderIcon}>
                <CheckCircle size={22} color="#10b981" />
              </div>
              <h3 className={styles.modalTitle}>Encerrar Sessão de Aula</h3>
              <button 
                className={styles.modalCloseBtn}
                onClick={() => setIsFinishModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <p className={styles.modalDesc}>
              Você tem certeza que deseja finalizar esta aula com <strong>{sessionData?.otherPersonName}</strong>?
            </p>
            
            <div className={styles.modalCallout}>
              {sessionData?.isStudent ? (
                <span>Ao encerrar, você poderá avaliar a didática do seu tutor e o progresso da aula.</span>
              ) : (
                <span>A aula será marcada como concluída e a liberação dos fundos seguirá o cronograma de repasse.</span>
              )}
            </div>

            <div className={styles.modalActions}>
              <button 
                className="btn btn--secondary" 
                onClick={() => setIsFinishModalOpen(false)}
                disabled={isFinishing}
              >
                Continuar na Aula
              </button>
              <button 
                className={styles.confirmFinishBtn} 
                onClick={handleConfirmFinishSession}
                disabled={isFinishing}
              >
                {isFinishing ? (
                  <>
                    <Loader2 size={16} className={styles.spin} /> Finalizando...
                  </>
                ) : (
                  'Confirmar e Finalizar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Avaliação da Aula (Disparado para o Aluno) */}
      {isReviewModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={`${styles.modalCard} ${styles.reviewCard}`}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Avalie sua Aula</h3>
                <p className={styles.reviewSub}>
                  Como foi sua experiência com <strong>{sessionData?.tutorName}</strong>?
                </p>
              </div>
              <button 
                className={styles.modalCloseBtn}
                onClick={() => {
                  setIsReviewModalOpen(false);
                  router.push('/dashboard/student');
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Estrelas Interativas */}
            <div className={styles.starRatingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={styles.starSelectBtn}
                  onMouseEnter={() => setReviewHoverRating(star)}
                  onMouseLeave={() => setReviewHoverRating(0)}
                  onClick={() => setReviewRating(star)}
                >
                  <Star
                    size={32}
                    fill={star <= (reviewHoverRating || reviewRating) ? '#f59e0b' : 'none'}
                    color={star <= (reviewHoverRating || reviewRating) ? '#f59e0b' : '#64748b'}
                  />
                </button>
              ))}
              <span className={styles.starRatingLabel}>
                {reviewRating === 5 && 'Excelente! 🚀'}
                {reviewRating === 4 && 'Muito boa! 👍'}
                {reviewRating === 3 && 'Razoável 👌'}
                {reviewRating === 2 && 'Deixou a desejar 😕'}
                {reviewRating === 1 && 'Ruim 😞'}
              </span>
            </div>

            {/* Tags de Destaque */}
            <div className={styles.reviewTagsSection}>
              <span className={styles.reviewTagsTitle}>O que se destacou?</span>
              <div className={styles.reviewTagsList}>
                {REVIEW_TAGS.map((tag) => {
                  const isSelected = selectedReviewTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      className={`${styles.reviewTagBtn} ${isSelected ? styles.reviewTagActive : ''}`}
                      onClick={() => toggleReviewTag(tag)}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comentário Opcional */}
            <div className={styles.reviewCommentGroup}>
              <label className={styles.reviewCommentLabel}>
                Comentário ou feedback (opcional)
              </label>
              <textarea
                className={styles.reviewCommentTextarea}
                placeholder="Conte com detalhes como o tutor te ajudou a aprender..."
                rows={3}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
            </div>

            <div className={styles.modalActions}>
              <button 
                className="btn btn--secondary" 
                onClick={() => {
                  setIsReviewModalOpen(false);
                  router.push('/dashboard/student');
                }}
                disabled={isSubmittingReview}
              >
                Pular por agora
              </button>
              <button 
                className="btn btn--primary" 
                onClick={handleSubmitReview}
                disabled={isSubmittingReview}
              >
                {isSubmittingReview ? (
                  <>
                    <Loader2 size={16} className={styles.spin} /> Enviando...
                  </>
                ) : (
                  'Enviar Avaliação'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
