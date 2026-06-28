import type { Metadata } from "next";
import "./globals.css";
import SessionProviderWrapper from "./components/SessionProviderWrapper";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "OpenLearn | Aulas Particulares de Inteligência Artificial com Especialistas",
  description:
    "Domine Inteligência Artificial, Engenharia de Prompts e Automação. Plataforma de aulas particulares (1:1) online com os melhores tutores e mentores do mercado. Aprenda ChatGPT, LangChain, e mais.",
  keywords: [
    "inteligência artificial",
    "aulas particulares de IA",
    "curso de inteligência artificial online",
    "professor de IA",
    "engenharia de prompts",
    "automação com IA",
    "mentor de IA",
    "aprender IA do zero",
    "ChatGPT na prática",
    "machine learning",
    "Python para IA"
  ],
  openGraph: {
    title: "OpenLearn | Aulas Particulares de Inteligência Artificial",
    description: "Aprenda Inteligência Artificial na prática com aulas 1:1 ao vivo. Conecte-se com os melhores especialistas.",
    type: "website",
    locale: "pt_BR",
    siteName: "OpenLearn",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <SessionProviderWrapper>
          <Toaster position="top-right" richColors />
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
