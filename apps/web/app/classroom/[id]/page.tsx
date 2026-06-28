'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Camera, Code, Columns, PanelRightClose, PanelRightOpen, Loader2 } from 'lucide-react';
import DailyIframe from '@daily-co/daily-js';
import { fetchClassroomData, saveSessionNotes } from './actions';
import styles from './classroom.module.css';

export default function ClassroomPage({ params }: any) {
  const [activeTab, setActiveTab] = useState<'chat' | 'notes'>('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mainView, setMainView] = useState<'video' | 'code' | 'split'>('video');
  const [sessionData, setSessionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timerText, setTimerText] = useState('00:00:00');
  
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const callRef = useRef<HTMLDivElement>(null);
  const callFrameRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial Data Fetch
  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchClassroomData(params.id);
        if (res.success) {
          setSessionData(res.data);
          setNotes(res.data.notes);
        }
      } catch (err) {
        console.error("Failed to load session", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [params.id]);

  // Daily.co iframe setup
  useEffect(() => {
    if (sessionData?.dailyRoomUrl && callRef.current && !callFrameRef.current) {
      callFrameRef.current = DailyIframe.createFrame(callRef.current, {
        showLeaveButton: true,
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: '0',
          borderRadius: '12px',
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
        if (data.success) {
          setMessages(data.data);
          // Scroll to bottom
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      } catch (err) {}
    };
    fetchMsgs();
    const interval = setInterval(fetchMsgs, 3000);
    return () => clearInterval(interval);
  }, [sessionData?.otherUserId]);

  const handleSendMessage = async () => {
    if (!msgInput.trim() || !sessionData) return;
    
    const content = msgInput;
    setMsgInput('');
    
    // Optimistic UI update
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
    }
  };

  // Notes Autosave
  useEffect(() => {
    if (!sessionData || notes === sessionData.notes) return;
    setSavingNotes(true);
    const timeout = setTimeout(async () => {
      try {
        await saveSessionNotes(params.id, notes);
        setSessionData((prev: any) => ({ ...prev, notes }));
      } catch (err) {}
      setSavingNotes(false);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [notes, sessionData, params.id]);

  return (
    <div className={styles.classroomWrapper}>
      {/* Classroom Header */}
      <header className={styles.classHeader}>
        <div className={styles.headerLeft}>
          <Link href="/dashboard/student" className={styles.backBtn}>
            ← Sair da Sala
          </Link>
          <div className={styles.classTitle}>
            <span className={styles.liveBadge}>AO VIVO</span>
            <h2>{sessionData ? sessionData.subjectName : "Carregando..."}</h2>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.timer}>{timerText}</div>
          <button className="btn btn--secondary btn--sm">Problemas técnicos?</button>
          <button 
            className={styles.toggleSidebarBtn}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? "Ocultar painel" : "Mostrar painel"}
          >
            {isSidebarOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
          </button>
        </div>
      </header>

      <main className={styles.mainArea}>
        {/* Main Content Area */}
        <section className={styles.centerSection}>
          <div className={styles.viewToggles}>
            <button 
              className={`${styles.viewToggleBtn} ${mainView === 'video' ? styles.viewToggleActive : ''}`}
              onClick={() => setMainView('video')}
            ><Camera size={14} /> Câmeras</button>
            <button 
              className={`${styles.viewToggleBtn} ${mainView === 'code' ? styles.viewToggleActive : ''}`}
              onClick={() => setMainView('code')}
            ><Code size={14} /> Código</button>
            <button 
              className={`${styles.viewToggleBtn} ${mainView === 'split' ? styles.viewToggleActive : ''}`}
              onClick={() => setMainView('split')}
            ><Columns size={14} /> Dividir</button>
          </div>

          <div className={`${styles.workspaceArea} ${styles[`workspace-${mainView}`]}`}>
            {/* Video View */}
            {(mainView === 'video' || mainView === 'split') && (
              <div className={styles.videoWorkspace}>
                <div className={styles.videoPlaceholder}>
                  {isLoading ? (
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-secondary)'}}>
                      <Loader2 size={32} className="spin" color="currentColor" />
                      <p style={{marginTop: '16px'}}>Conectando à sala virtual...</p>
                    </div>
                  ) : sessionData?.dailyRoomUrl ? (
                    <div ref={callRef} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-secondary)'}}>
                      <p>Sala de vídeo não disponível. (Status: {sessionData?.status})</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Code Editor View */}
            {(mainView === 'code' || mainView === 'split') && (
              <div className={styles.codeWorkspace}>
                <div className={styles.codeEditorHeader}>
                  <span className={styles.codeFileName}>script.py</span>
                  <div className={styles.codeLangBadge}>Python</div>
                </div>
                <div className={styles.codeEditorBody}>
                  <div className={styles.codeLineNumbers}>
                    <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                  </div>
                  <pre className={styles.codeContent}>
                    <code>
<span className={styles.codeKeyword}>import</span> openai<br/>
<span className={styles.codeKeyword}>import</span> os<br/>
<br/>
<span className={styles.codeKeyword}>def</span> <span className={styles.codeFunction}>generate_response</span>(prompt):<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span className={styles.codeComment}># TODO: Implement OpenAI call</span><br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span className={styles.codeKeyword}>return</span> <span className={styles.codeString}>"Hello from OpenLearn!"</span>
                    </code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Sidebar */}
        <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
          <div className={styles.sidebarTabs}>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'chat' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              Chat
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'notes' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('notes')}
            >
              Anotações {savingNotes && <Loader2 size={12} className="spin" style={{marginLeft: 4}} />}
            </button>
          </div>

          <div className={styles.sidebarContent}>
            {activeTab === 'chat' ? (
              <div className={styles.chatArea}>
                <div className={styles.messagesList}>
                  {messages.length === 0 && <p style={{color: 'var(--color-text-secondary)', textAlign: 'center', fontSize: 'var(--text-sm)', marginTop: '20px'}}>Nenhuma mensagem ainda.</p>}
                  {messages.map(msg => {
                    const isSelf = msg.senderId === sessionData.currentUserId;
                    return (
                      <div key={msg.id} className={`${styles.message} ${isSelf ? styles.messageSelf : ''}`}>
                        <div className={styles.messageSender}>{isSelf ? 'Você' : sessionData.otherPersonName}</div>
                        <div className={styles.messageBubble}>{msg.content}</div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
                <div className={styles.chatInput}>
                  <input 
                    type="text" 
                    placeholder="Digite uma mensagem..." 
                    className="input" 
                    value={msgInput}
                    onChange={e => setMsgInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  />
                  <button className="btn btn--primary" onClick={handleSendMessage}>Enviar</button>
                </div>
              </div>
            ) : (
              <div className={styles.notesArea}>
                <p className={styles.notesHelp}>
                  Suas anotações são privadas e ficarão salvas no seu painel após a aula.
                </p>
                <textarea 
                  className={styles.notesTextarea} 
                  placeholder="Escreva suas anotações aqui..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                ></textarea>
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
