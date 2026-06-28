import React from 'react';
import { auth } from '../../../../auth';
import { redirect } from 'next/navigation';
import prisma from '@ailearn/database';
import ScheduleManager from './ScheduleManager';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function TutorSchedulePage() {
  const sessionAuth = await auth();
  if (sessionAuth?.user?.role !== 'tutor') {
    redirect('/dashboard/student');
  }

  const userId = sessionAuth.user.id;
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId },
    include: {
      availability: true,
      timeOffs: true,
      subjects: { include: { subject: true } },
      sessions: {
        where: { 
          OR: [
            { status: 'completed' },
            { scheduledEnd: { gt: new Date() }, status: { in: ['confirmed', 'pending_confirmation'] } }
          ]
        },
        include: { student: { select: { fullName: true, id: true } }, subject: { select: { name: true } } },
        orderBy: { scheduledStart: 'asc' }
      }
    }
  });

  if (!tutorProfile) {
    redirect('/onboarding/tutor');
  }

  const pastStudentsMap = new Map();
  tutorProfile.sessions.filter(s => s.status === 'completed').forEach(s => {
    if (!pastStudentsMap.has(s.studentId)) {
      pastStudentsMap.set(s.studentId, s.student);
    }
  });
  const pastStudents = Array.from(pastStudentsMap.values());

  const upcomingSessions = tutorProfile.sessions.filter(s => s.scheduledEnd > new Date() && (s.status === 'confirmed' || s.status === 'pending_confirmation'));

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/dashboard/tutor" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: '14px', marginBottom: '16px' }}>
          <ArrowLeft size={16} /> Voltar ao Dashboard
        </Link>
        <h1 className="heading-2">Gerenciar Horários</h1>
        <p className="text-muted">Configure sua disponibilidade, adicione folgas e faça agendamentos manuais.</p>
      </div>

      <ScheduleManager 
        tutorId={tutorProfile.id}
        availability={tutorProfile.availability}
        timeOffs={tutorProfile.timeOffs}
        pastStudents={pastStudents}
        subjects={tutorProfile.subjects.map(ts => ts.subject)}
        upcomingSessions={upcomingSessions}
      />
    </div>
  );
}
