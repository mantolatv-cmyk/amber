import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Initialize SES Client
// In production, these should be securely injected via environment variables.
// If the environment doesn't have credentials, we mock the email sending.
const getSESClient = () => {
  if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return null;
  }
  return new SESClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
  });
};

const sesClient = getSESClient();
const SENDER_EMAIL = process.env.SES_SENDER_EMAIL || "no-reply@openlearn.com";

export interface EmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

/**
 * Send an email using Amazon SES.
 * If credentials are missing (e.g. in development without env vars), it logs the email instead.
 */
export async function sendEmail({ to, subject, htmlBody, textBody }: EmailOptions): Promise<boolean> {
  if (!sesClient) {
    console.warn(`⚠️ MOCK EMAIL [to: ${to}]: ${subject}`);
    // console.log(htmlBody);
    return true;
  }

  try {
    const command = new SendEmailCommand({
      Source: SENDER_EMAIL,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: "UTF-8",
          },
          ...(textBody && {
            Text: {
              Data: textBody,
              Charset: "UTF-8",
            }
          })
        },
      },
    });

    const response = await sesClient.send(command);
    console.log(`✅ Email sent to ${to}. MessageId: ${response.MessageId}`);
    return true;
  } catch (error) {
    console.error("Failed to send email via SES:", error);
    return false;
  }
}

// ============================================================================
// Email Templates
// ============================================================================

export const EmailTemplates = {
  sessionConfirmed: (studentName: string, tutorName: string, date: string, joinUrl: string) => ({
    subject: `Aula Confirmada: ${tutorName}`,
    htmlBody: `
      <h2>Olá ${studentName},</h2>
      <p>Sua aula com <strong>${tutorName}</strong> foi confirmada para <strong>${date}</strong>.</p>
      <p>Para acessar a sala de aula virtual no horário marcado, clique no link abaixo:</p>
      <a href="${joinUrl}" style="display:inline-block;padding:10px 20px;background:#6C5CE7;color:#fff;text-decoration:none;border-radius:5px;">Acessar Sala</a>
      <p>Bons estudos!</p>
      <p>Equipe OpenLearn</p>
    `,
  }),
  
  sessionCancelled: (userName: string, tutorName: string, date: string, reason: string) => ({
    subject: `Aula Cancelada: ${tutorName}`,
    htmlBody: `
      <h2>Olá ${userName},</h2>
      <p>Sua aula com <strong>${tutorName}</strong> agendada para <strong>${date}</strong> foi cancelada.</p>
      <p><strong>Motivo:</strong> ${reason}</p>
      <p>Caso tenha dúvidas ou precise de reembolso, acesse o painel da plataforma.</p>
      <p>Equipe OpenLearn</p>
    `,
  })
};
