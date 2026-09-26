import React from 'react';
import Header from '../components/Header/Header';
import Footer from '../components/Footer/Footer';

export const metadata = {
  title: 'Termos de Uso e Serviço | OpenLearn',
  description: 'Condições gerais de intermediação, pagamentos em escrow e regras de cancelamento da OpenLearn.',
};

export default function TermsPage() {
  return (
    <>
      <Header variant="light" backLink={{ label: 'Voltar', href: '/' }} />

      <main style={{ maxWidth: '840px', margin: '40px auto 80px', padding: '0 24px', lineHeight: 1.7, color: 'var(--color-text-primary)' }}>
        <h1 className="heading-1" style={{ marginBottom: '8px' }}>Termos de Uso e Serviço</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px' }}>
          Última atualização: Setembro de 2026
        </p>

        <section style={{ marginBottom: '28px' }}>
          <h2 className="heading-3" style={{ marginBottom: '12px' }}>1. Objeto e Natureza da Plataforma</h2>
          <p>
            A <strong>OpenLearn</strong> é uma plataforma digital de intermediação que conecta alunos interessados em aprender tecnologias de Inteligência Artificial a tutores e mentores independentes especializados. A OpenLearn atua exclusivamente como intermediadora tecnológica e financeira de pagamentos, não configurando vínculo empregatício com os tutores.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 className="heading-3" style={{ marginBottom: '12px' }}>2. Pagamentos, Taxas e Sistema de Custódia (Escrow)</h2>
          <p>
            Todos os pagamentos são processados com segurança via <strong>Stripe</strong>. Ao contratar uma aula, o valor pago pelo aluno é mantido em <em>custódia financeira (escrow)</em> pela plataforma até 1 (uma) hora após o término da sessão.
          </p>
          <p style={{ marginTop: '8px' }}>
            Após esse prazo e ausente qualquer abertura de disputa formal por parte do aluno ou tutor, o repasse líquido é transferido automaticamente para a conta bancária ou Stripe Express cadastrada pelo tutor, descontada a taxa de comissão da plataforma (que varia regressivamente de 33% a 18% conforme o volume acumulado de aulas realizadas).
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 className="heading-3" style={{ marginBottom: '12px' }}>3. Política de Cancelamento e Reembolsos</h2>
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li><strong>Cancelamento efetuado pelo Tutor:</strong> Reembolso integral (100%) garantido ao aluno, independentemente do prazo de cancelamento.</li>
            <li><strong>Cancelamento pelo Aluno com mais de 24h de antecedência:</strong> Reembolso de 100% do valor pago.</li>
            <li><strong>Cancelamento pelo Aluno entre 4h e 24h de antecedência:</strong> Reembolso parcial de 50% do valor da aula.</li>
            <li><strong>Cancelamento pelo Aluno com menos de 4h de antecedência ou não comparecimento (No-Show):</strong> Sem direito a reembolso (0%).</li>
          </ul>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 className="heading-3" style={{ marginBottom: '12px' }}>4. Sala Virtual e Conduta</h2>
          <p>
            As aulas são ministradas através de salas de videoconferência WebRTC criptografadas. É estritamente vedada qualquer conduta discriminatória, assédio, ou tentativa de negociação financeira fora do ambiente seguro da plataforma, sob pena de suspensão imediata e bloqueio da conta.
          </p>
        </section>

        <section style={{ marginBottom: '28px' }}>
          <h2 className="heading-3" style={{ marginBottom: '12px' }}>5. Resolução de Disputas</h2>
          <p>
            Em caso de problemas técnicos impeditivos na sala de aula ou ausência injustificada do professor, o aluno poderá acionar o suporte em até 1 hora após o horário agendado. A equipe de moderação avaliará os registros e determinará o estorno ou reagendamento conforme aplicável.
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}
