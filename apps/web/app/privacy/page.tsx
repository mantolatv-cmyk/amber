import React from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';

export const metadata = {
  title: 'Política de Privacidade e LGPD | OpenLearn',
  description: 'Como tratamos seus dados pessoais de acordo com a Lei Geral de Proteção de Dados (LGPD).',
};

export default function PrivacyPage() {
  return (
    <>
      <Header variant="light" backLink={{ label: 'Voltar', href: '/' }} />

      <main style={{ maxWidth: '840px', margin: '40px auto 80px', padding: '0 24px', lineHeight: 1.7, color: 'var(--color-text-primary)' }}>
        <h1 className="heading-1" style={{ marginBottom: '8px' }}>Política de Privacidade</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px' }}>
          Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD)
        </p>

        <section style={{ marginBottom: '28px' }}>
          <h2 className="heading-3" style={{ marginBottom: '12px' }}>1. Dados Coletados</h2>
          <p>
            Coletamos apenas as informações estritamente necessárias para a prestação dos serviços de mentoria e processamento de pagamentos:
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li><strong>Dados Cadastrais:</strong> Nome completo, endereço de e-mail e credenciais de acesso criptografadas com bcrypt.</li>
            <li><strong>Dados de Tutores:</strong> Biografia, foto de perfil, histórico profissional, matérias e links de vídeo de apresentação.</li>
            <li><strong>Dados de Pagamento:</strong> Processados diretamente pela Stripe sob certificação PCI-DSS nível 1. A OpenLearn não armazena dados de cartão de crédito em seus servidores.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 className="heading-3" style={{ marginBottom: '12px' }}>2. Finalidade do Tratamento de Dados</h2>
          <p>
            Os dados pessoais são tratados para permitir a autenticação segura, viabilizar o agendamento de aulas, notificar os usuários sobre eventos importantes da sessão e cumprir exigências fiscais e legais.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 className="heading-3" style={{ marginBottom: '12px' }}>3. Compartilhamento Seguro com Terceiros</h2>
          <p>
            Seus dados são compartilhados apenas com os fornecedores essenciais para a execução do serviço:
          </p>
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li><strong>Stripe:</strong> Processamento de pagamentos e repasses aos tutores.</li>
            <li><strong>Daily.co:</strong> Provisionamento das salas de videoconferência WebRTC.</li>
            <li><strong>Amazon SES:</strong> Disparo de e-mails transacionais e avisos de aula.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 className="heading-3" style={{ marginBottom: '12px' }}>4. Direitos do Titular (LGPD)</h2>
          <p>
            Você tem o direito de solicitar a qualquer momento a confirmação da existência de tratamento, o acesso aos seus dados, a correção de dados incompletos ou a exclusão definitiva da sua conta, através do nosso canal de suporte ou nas configurações do seu painel.
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}
