import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '../../../auth';
import prisma from '@ailearn/database';
import { isDatabaseReachable } from '../../../lib/db-check';
import Header from '../../components/Header/Header';
import OnboardingWizard from './OnboardingWizard';

export const metadata = {
  title: 'Onboarding do Tutor | OpenLearn',
  description: 'Complete seu cadastro e comece a dar aulas de Inteligência Artificial.',
};

export default async function TutorOnboardingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/onboarding/tutor');
  }

  let subjects: any[] = [];
  let tutorProfile: any = null;

  const dbOnline = await isDatabaseReachable();
  if (dbOnline) {
    try {
      subjects = await prisma.subject.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        select: { id: true, name: true, category: true },
      });

      tutorProfile = await prisma.tutorProfile.findUnique({
        where: { userId: session.user.id },
        include: {
          subjects: true,
          availability: true,
        },
      });
    } catch (err) {
      console.warn("Database error in onboarding page:", err);
    }
  }

  if (subjects.length === 0) {
    subjects = [
      { id: 'sub-1', name: 'Engenharia de Prompts', category: 'prompt-engineering' },
      { id: 'sub-2', name: 'Automação com IA', category: 'automation' },
      { id: 'sub-3', name: 'LangChain & LlamaIndex', category: 'dev' },
      { id: 'sub-4', name: 'Fine-tuning de LLMs', category: 'dev' },
      { id: 'sub-5', name: 'IA para Desenvolvedores', category: 'dev' },
    ];
  }

  return (
    <>
      <Header
        variant="light"
        navLinks={[]}
        showAuth={true}
        backLink={{ label: 'Ir para o Dashboard', href: '/dashboard/tutor' }}
      />
      <main>
        <OnboardingWizard
          subjects={subjects}
          initialProfile={tutorProfile}
        />
      </main>
    </>
  );
}
