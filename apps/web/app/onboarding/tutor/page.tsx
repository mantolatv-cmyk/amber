import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '../../../auth';
import prisma from '@ailearn/database';
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

  if ((session.user as any).role !== 'tutor') {
    redirect('/dashboard/student');
  }

  const subjects = await prisma.subject.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, category: true },
  });

  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      subjects: true,
      availability: true,
    },
  });

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
