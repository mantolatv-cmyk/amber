'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, MessageSquare, Loader2 } from 'lucide-react';
import styles from './messages.module.css';

interface Contact {
  id: string;
  name: string;
  avatarUrl: string | null;
  lastMessage: any | null;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const contactIdParam = searchParams.get('contactId');
  const nameParam = searchParams.get('name');

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch contacts on load
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const url = contactIdParam 
          ? `/api/v1/messages?withUser=${contactIdParam}`
          : '/api/v1/messages';
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          let list = data.data;

          // If param provided and not yet in contacts list, add placeholder
          if (contactIdParam && !list.some((c: any) => c.id === contactIdParam)) {
            const newContact: Contact = {
              id: contactIdParam,
              name: nameParam || 'Tutor',
              avatarUrl: null,
              lastMessage: null,
            };
            list = [newContact, ...list];
          }

          setContacts(list);

          // Select the target contact or first contact
          if (contactIdParam) {
            const target = list.find((c: any) => c.id === contactIdParam);
            if (target) setActiveContact(target);
          } else if (list.length > 0 && !activeContact) {
            setActiveContact(list[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load contacts', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContacts();
  }, [contactIdParam, nameParam]);

  // Fetch messages when a contact is selected
  useEffect(() => {
    if (!activeContact) return;
    
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/v1/messages?contactId=${activeContact.id}`);
        const data = await res.json();
        if (data.success) {
          setMessages(data.data);
        }
      } catch (err) {
        console.error('Failed to load messages', err);
      }
    };
    
    fetchMessages();
    
    // Simple polling for new messages (every 5s)
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [activeContact]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeContact) return;

    setIsSending(true);
    try {
      const res = await fetch('/api/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: activeContact.id,
          content: newMessage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, data.data]);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.pageContainer} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} className="spin" color="var(--color-primary-600)" />
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Sidebar */}
      <div className={styles.contactsSidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className="heading-3">Mensagens</h2>
        </div>
        <div className={styles.contactsList}>
          {contacts.length === 0 ? (
            <div style={{ padding: 'var(--space-4)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
              Nenhum contato ainda.
            </div>
          ) : (
            contacts.map(contact => (
              <div 
                key={contact.id} 
                className={`${styles.contactItem} ${activeContact?.id === contact.id ? styles.contactActive : ''}`}
                onClick={() => setActiveContact(contact)}
              >
                <div className={styles.avatar}>
                  {contact.name.substring(0, 2).toUpperCase()}
                </div>
                <div className={styles.contactInfo}>
                  <div className={styles.contactName}>{contact.name}</div>
                  <div className={styles.contactPreview}>
                    {contact.lastMessage?.contentPreview || 'Nova conversa'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      {activeContact ? (
        <div className={styles.chatArea}>
          <div className={styles.chatHeader}>
            <div className={styles.avatar} style={{ width: 40, height: 40, fontSize: '1rem' }}>
              {activeContact.name.substring(0, 2).toUpperCase()}
            </div>
            <h3 style={{ fontWeight: 600 }}>{activeContact.name}</h3>
          </div>
          
          <div className={styles.messagesContainer}>
            {messages.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Nenhuma mensagem ainda. Diga olá!</p>
              </div>
            ) : (
              messages.map(msg => {
                const isSelf = msg.senderId !== activeContact.id;
                return (
                  <div key={msg.id} className={`${styles.messageWrapper} ${isSelf ? styles.messageWrapperSelf : styles.messageWrapperOther}`}>
                    <div className={`${styles.messageBubble} ${isSelf ? styles.messageSelf : styles.messageOther}`}>
                      {msg.content}
                    </div>
                    <div className={styles.messageTime}>
                      {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className={styles.inputArea} onSubmit={handleSendMessage}>
            <input 
              type="text" 
              className={styles.chatInput} 
              placeholder="Digite sua mensagem..." 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button type="submit" className={styles.sendBtn} disabled={!newMessage.trim() || isSending}>
              {isSending ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>
      ) : (
        <div className={styles.emptyState}>
          <MessageSquare size={64} className={styles.emptyIcon} strokeWidth={1} />
          <h2 className="heading-3">Suas Mensagens</h2>
          <p>Selecione uma conversa na lateral para começar.</p>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '60px' }}>
        <Loader2 size={32} className="spin" color="var(--color-primary)" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
