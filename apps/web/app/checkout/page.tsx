'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheck, 
  CreditCard, 
  QrCode, 
  Check, 
  Copy, 
  Clock, 
  Calendar, 
  User, 
  Video, 
  Lock, 
  Sparkles, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import Header from '../components/Header/Header';
import styles from './checkout.module.css';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tutorId = searchParams.get('tutorId') || 'tutor-1';
  const tutorName = searchParams.get('tutorName') || 'Marina Costa';
  const headline = searchParams.get('headline') || 'Especialista em Inteligência Artificial';
  const subjectName = searchParams.get('subjectName') || 'LangChain & RAG Avançado';
  const scheduledStartParam = searchParams.get('scheduledStart');
  const scheduledEndParam = searchParams.get('scheduledEnd');
  const isTrial = searchParams.get('isTrial') === 'true';
  const priceCents = parseInt(searchParams.get('priceCents') || (isTrial ? '4900' : '15000'), 10);
  const notes = searchParams.get('notes') || '';

  const scheduledDate = scheduledStartParam ? new Date(scheduledStartParam) : new Date(Date.now() + 3600000 * 2);
  const durationMinutes = isTrial ? 30 : 60;
  const priceFormatted = `R$ ${(priceCents / 100).toFixed(2)}`;

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [pixTimeLeft, setPixTimeLeft] = useState(899); // 15:00 min

  // Card Inputs
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [installments, setInstallments] = useState('1');

  // Customer Inputs
  const [customerName, setCustomerName] = useState('João Aluno Demo');
  const [customerEmail, setCustomerEmail] = useState('aluno@example.com');
  const [customerCpf, setCustomerCpf] = useState('123.456.789-00');
  const [customerPhone, setCustomerPhone] = useState('(11) 98765-4321');

  // Pix string simulation
  const pixCode = `00020126580014br.gov.bcb.pix0136${tutorId}-openlearn-booking520400005303986540${priceCents}5802BR5916OpenLearn BR6009Sao Paulo62070503***6304ABCD`;

  // Countdown timer for Pix
  useEffect(() => {
    if (paymentMethod !== 'pix' || isSuccess) return;
    const interval = setInterval(() => {
      setPixTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [paymentMethod, isSuccess]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setCopiedPix(true);
    toast.success('Código PIX copiado com sucesso! Abra o app do seu banco para pagar.');
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleFillTestCard = () => {
    setCardNumber('4242 •••• •••• 4242');
    setCardHolder('JOAO ALUNO DEMO');
    setCardExpiry('12/28');
    setCardCvv('123');
    toast.info('Dados de cartão de teste preenchidos!');
  };

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    // Simulate real gateway latency & webhook confirmation
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      toast.success('Pagamento confirmado com sucesso! Sua aula está agendada.');
    }, 1800);
  };

  const tutorInitials = tutorName
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <>
      {/* Checkout Navbar */}
      <nav className={styles.checkoutNavbar}>
        <div className={styles.navContainer}>
          <Link href="/" className={styles.navLogo}>
            <span className={styles.logoBadge}><Sparkles size={16} /></span>
            <span className={styles.logoText}>OpenLearn</span>
          </Link>
          <div className={styles.secureBadge}>
            <Lock size={15} color="#10b981" />
            <span>Ambiente 100% Criptografado & Seguro</span>
          </div>
        </div>
      </nav>

      <main className={styles.checkoutMain}>
        <div className={styles.container}>
          
          {/* Back link */}
          <Link href={`/tutor/${tutorId}/book`} className={styles.backLink}>
            <ArrowLeft size={16} /> Alterar dia ou horário
          </Link>

          {!isSuccess ? (
            <div className={styles.checkoutGrid}>
              
              {/* Left Column: Payment Form */}
              <div className={styles.paymentCol}>
                <div className={styles.cardBox}>
                  <h2 className={styles.cardBoxTitle}>Forma de Pagamento</h2>
                  <p className={styles.cardBoxSubtitle}>
                    Selecione como deseja efetuar o pagamento seguro da sua sessão.
                  </p>

                  {/* Payment Method Tabs */}
                  <div className={styles.tabsGrid}>
                    <button
                      type="button"
                      className={`${styles.tabBtn} ${paymentMethod === 'pix' ? styles.tabBtnActive : ''}`}
                      onClick={() => setPaymentMethod('pix')}
                    >
                      <div className={styles.tabIconWrap}>
                        <QrCode size={22} color={paymentMethod === 'pix' ? 'var(--color-primary)' : 'inherit'} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div className={styles.tabTitle}>PIX Instantâneo</div>
                        <div className={styles.tabBadgeGreen}>Aprovação Imediata</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`${styles.tabBtn} ${paymentMethod === 'card' ? styles.tabBtnActive : ''}`}
                      onClick={() => setPaymentMethod('card')}
                    >
                      <div className={styles.tabIconWrap}>
                        <CreditCard size={22} color={paymentMethod === 'card' ? 'var(--color-primary)' : 'inherit'} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div className={styles.tabTitle}>Cartão de Crédito</div>
                        <div className={styles.tabSubtext}>Até 12x via Stripe</div>
                      </div>
                    </button>
                  </div>

                  {/* PIX VIEW */}
                  {paymentMethod === 'pix' && (
                    <div className={styles.pixContainer}>
                      <div className={styles.pixQrBox}>
                        {/* High resolution SVG styled QR Code placeholder */}
                        <div className={styles.qrVisual}>
                          <svg viewBox="0 0 100 100" width="160" height="160" className={styles.qrSvg}>
                            <rect width="100" height="100" fill="#ffffff" rx="8" />
                            {/* Corner squares */}
                            <rect x="10" y="10" width="24" height="24" fill="#0f172a" rx="4" />
                            <rect x="14" y="14" width="16" height="16" fill="#ffffff" rx="2" />
                            <rect x="18" y="18" width="8" height="8" fill="#6C5CE7" rx="1" />

                            <rect x="66" y="10" width="24" height="24" fill="#0f172a" rx="4" />
                            <rect x="70" y="14" width="16" height="16" fill="#ffffff" rx="2" />
                            <rect x="74" y="18" width="8" height="8" fill="#6C5CE7" rx="1" />

                            <rect x="10" y="66" width="24" height="24" fill="#0f172a" rx="4" />
                            <rect x="14" y="70" width="16" height="16" fill="#ffffff" rx="2" />
                            <rect x="18" y="74" width="8" height="8" fill="#6C5CE7" rx="1" />

                            {/* Center and pattern matrix dots */}
                            <rect x="42" y="12" width="6" height="6" fill="#0f172a" rx="1" />
                            <rect x="52" y="18" width="6" height="6" fill="#6C5CE7" rx="1" />
                            <rect x="40" y="28" width="8" height="8" fill="#0f172a" rx="1" />
                            <rect x="12" y="44" width="6" height="6" fill="#6C5CE7" rx="1" />
                            <rect x="24" y="50" width="6" height="6" fill="#0f172a" rx="1" />
                            <rect x="44" y="44" width="12" height="12" fill="#6C5CE7" rx="2" />
                            <rect x="64" y="42" width="8" height="8" fill="#0f172a" rx="1" />
                            <rect x="80" y="48" width="6" height="6" fill="#6C5CE7" rx="1" />
                            <rect x="44" y="68" width="8" height="8" fill="#0f172a" rx="1" />
                            <rect x="68" y="66" width="6" height="6" fill="#6C5CE7" rx="1" />
                            <rect x="78" y="76" width="8" height="8" fill="#0f172a" rx="1" />
                          </svg>
                          <div className={styles.qrBadge}>
                            <Sparkles size={12} /> PIX Oficial
                          </div>
                        </div>

                        <div className={styles.pixInstructions}>
                          <div className={styles.pixTimerRow}>
                            <Clock size={16} color="#f59e0b" />
                            <span>Válido por: <strong>{formatTimer(pixTimeLeft)}</strong></span>
                          </div>
                          <ol className={styles.pixSteps}>
                            <li>Abra o aplicativo do seu banco preferido.</li>
                            <li>Escolha a opção <strong>Pagar via Pix com QR Code</strong> ou <strong>Pix Copia e Cola</strong>.</li>
                            <li>A confirmação ocorre automaticamente em poucos segundos!</li>
                          </ol>
                        </div>
                      </div>

                      {/* Pix Copia e Cola */}
                      <div className={styles.copyBox}>
                        <div className={styles.copyLabel}>Código Pix Copia e Cola:</div>
                        <div className={styles.copyInputRow}>
                          <input 
                            type="text" 
                            readOnly 
                            value={pixCode} 
                            className={styles.copyInput} 
                          />
                          <button 
                            type="button" 
                            className={styles.copyBtn} 
                            onClick={handleCopyPix}
                          >
                            {copiedPix ? <Check size={16} /> : <Copy size={16} />}
                            {copiedPix ? 'Copiado!' : 'Copiar'}
                          </button>
                        </div>
                      </div>

                      {/* Instant simulation button */}
                      <div className={styles.simBox}>
                        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                          💡 <strong>Ambiente de Demonstração / Teste:</strong> Clique abaixo para simular a confirmação imediata do pagamento via webhook:
                        </div>
                        <button
                          type="button"
                          className={styles.simPayBtn}
                          onClick={handleProcessPayment}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 size={16} className="spin" /> Confirmando recebimento do Pix...
                            </>
                          ) : (
                            <>
                              <Zap size={16} /> Simular Pagamento Pix Recebido
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CREDIT CARD VIEW */}
                  {paymentMethod === 'card' && (
                    <div className={styles.cardForm}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                          Cartão de Crédito (Processado via Stripe)
                        </span>
                        <button
                          type="button"
                          className={styles.testCardBtn}
                          onClick={handleFillTestCard}
                        >
                          ⚡ Preencher Cartão de Teste
                        </button>
                      </div>

                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>Número do Cartão</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            className="input"
                            placeholder="0000 0000 0000 0000"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            maxLength={19}
                          />
                          <CreditCard size={18} color="var(--color-text-muted)" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                        </div>
                      </div>

                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>Nome Impresso no Cartão</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="NOME COMPLETO"
                          value={cardHolder}
                          onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className={styles.formField}>
                          <label className={styles.fieldLabel}>Validade</label>
                          <input
                            type="text"
                            className="input"
                            placeholder="MM/AA"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            maxLength={5}
                          />
                        </div>

                        <div className={styles.formField}>
                          <label className={styles.fieldLabel}>CVC / CVV</label>
                          <input
                            type="password"
                            className="input"
                            placeholder="123"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                            maxLength={4}
                          />
                        </div>
                      </div>

                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>Parcelamento</label>
                        <select
                          className="input"
                          value={installments}
                          onChange={(e) => setInstallments(e.target.value)}
                        >
                          <option value="1">1x de {priceFormatted} (sem juros)</option>
                          <option value="2">2x de R$ {((priceCents / 2) / 100).toFixed(2)} (sem juros)</option>
                          <option value="3">3x de R$ {((priceCents / 3) / 100).toFixed(2)} (sem juros)</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        className={styles.payCardBtn}
                        onClick={handleProcessPayment}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 size={18} className="spin" /> Processando cobrança...
                          </>
                        ) : (
                          <>
                            <Lock size={16} /> Pagar {priceFormatted} com Cartão
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Payer Information */}
                  <div className={styles.payerDetails}>
                    <h3 className={styles.payerTitle}>Dados para Emissão de Nota Fiscal</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label className={styles.fieldLabel}>Nome do Titular</label>
                        <input
                          type="text"
                          className="input"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className={styles.fieldLabel}>CPF</label>
                        <input
                          type="text"
                          className="input"
                          value={customerCpf}
                          onChange={(e) => setCustomerCpf(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Right Column: Order Summary */}
              <div className={styles.summaryCol}>
                <div className={styles.summaryBox}>
                  <h3 className={styles.summaryTitle}>Resumo da Sessão</h3>

                  {/* Tutor info */}
                  <div className={styles.tutorCardMini}>
                    <div className={styles.tutorAvatarMini}>{tutorInitials}</div>
                    <div>
                      <div className={styles.tutorNameMini}>{tutorName}</div>
                      <div className={styles.tutorHeadlineMini}>{headline}</div>
                      <span className={styles.subjectPill}>{subjectName}</span>
                    </div>
                  </div>

                  <div className={styles.summaryDivider} />

                  {/* Schedule info */}
                  <div className={styles.scheduleInfoBox}>
                    <div className={styles.scheduleInfoItem}>
                      <Calendar size={18} color="var(--color-primary)" />
                      <div>
                        <div className={styles.scheduleInfoLabel}>Data Selecionada</div>
                        <div className={styles.scheduleInfoVal}>
                          {scheduledDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    <div className={styles.scheduleInfoItem}>
                      <Clock size={18} color="var(--color-primary)" />
                      <div>
                        <div className={styles.scheduleInfoLabel}>Horário & Duração</div>
                        <div className={styles.scheduleInfoVal}>
                          {scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {durationMinutes} minutos ({isTrial ? 'Experimental' : 'Regular'})
                        </div>
                      </div>
                    </div>

                    <div className={styles.scheduleInfoItem}>
                      <Video size={18} color="#10b981" />
                      <div>
                        <div className={styles.scheduleInfoLabel}>Local da Sessão</div>
                        <div className={styles.scheduleInfoVal}>
                          Sala de Aula Virtual OpenLearn (1:1 com áudio, vídeo e editor)
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.summaryDivider} />

                  {/* Financial Breakdown */}
                  <div className={styles.priceRows}>
                    <div className={styles.priceRow}>
                      <span>Subtotal da aula ({durationMinutes} min)</span>
                      <span>{priceFormatted}</span>
                    </div>
                    <div className={styles.priceRow}>
                      <span>Taxa de serviço da plataforma</span>
                      <span style={{ color: '#10b981', fontWeight: 600 }}>Grátis (R$ 0,00)</span>
                    </div>
                    <div className={styles.totalRow}>
                      <span>Total a pagar</span>
                      <span className={styles.totalAmount}>{priceFormatted}</span>
                    </div>
                  </div>

                  {/* Escrow note */}
                  <div className={styles.escrowNotice}>
                    <ShieldCheck size={20} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <p>
                      <strong>Pagamento em Escrow:</strong> O valor só é repassado ao professor após a conclusão da sua aula e a sua avaliação.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* SUCCESS CONFIRMATION MODAL */
            <div className={styles.successCard}>
              <div className={styles.successIcon}>
                <CheckCircle2 size={64} color="#10b981" />
              </div>
              <div className={styles.successBadge}>
                <Sparkles size={16} /> Pagamento Confirmado
              </div>
              <h1 className={styles.successTitle}>Sua Aula Está Confirmada!</h1>
              <p className={styles.successSubtitle}>
                Enviamos a confirmação e as instruções de acesso para seu email (<strong>{customerEmail}</strong>).
              </p>

              <div className={styles.successReceipt}>
                <div className={styles.receiptRow}>
                  <span>Código do Pedido:</span>
                  <strong>#OPL-{Math.floor(100000 + Math.random() * 900000)}</strong>
                </div>
                <div className={styles.receiptRow}>
                  <span>Tutor(a):</span>
                  <strong>{tutorName}</strong>
                </div>
                <div className={styles.receiptRow}>
                  <span>Matéria:</span>
                  <strong>{subjectName}</strong>
                </div>
                <div className={styles.receiptRow}>
                  <span>Data e Hora:</span>
                  <strong>{scheduledDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long' })} às {scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</strong>
                </div>
                <div className={styles.receiptRow}>
                  <span>Forma de Pagamento:</span>
                  <strong>{paymentMethod === 'pix' ? 'PIX Instantâneo' : 'Cartão de Crédito'}</strong>
                </div>
                <div className={styles.receiptRow}>
                  <span>Valor Pago:</span>
                  <strong style={{ color: 'var(--color-primary)', fontSize: '18px' }}>{priceFormatted}</strong>
                </div>
              </div>

              <div className={styles.successActions}>
                <Link href="/classroom/demo-session-1" className={styles.enterRoomBtn}>
                  <Video size={18} /> Entrar na Sala de Aula Virtual
                </Link>
                <Link href="/dashboard/sessions" className={styles.viewSessionsBtn}>
                  <Calendar size={18} /> Ver Minhas Aulas
                </Link>
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: '16px' }}>
        <Loader2 size={40} className="spin" color="var(--color-primary)" />
        <p style={{ fontWeight: 600 }}>Carregando checkout seguro...</p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
