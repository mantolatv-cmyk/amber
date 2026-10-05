import React from 'react';
import { auth } from '../../../../auth';
import { redirect } from 'next/navigation';
import prisma from '@ailearn/database';
import { isDatabaseReachable } from '../../../../lib/db-check';
import ScheduleManager from './ScheduleManager';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function TutorSchedulePage() {
  const sessionAuth = await auth();
  if (sessionAuth?.user?.role !== 'tutor') {
    redirect('/dashboard/student');
  }

  const userId = sessionAuth.user.id;
  const dbOnline = await isDatabaseReachable();

  let tutorProfile: any = null;

  if (dbOnline) {
    try {
      tutorProfile = await prisma.tutorProfile.findUnique({
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
    } catch (err) {
      console.warn("Database error loading tutor schedule:", err);
    }
  }

  // Fallback demo schedule state for instant rendering when DB is offline
  if (!tutorProfile) {
    tutorProfile = {
      id: 'demo-tutor',
      availability: [
        { id: 'av-1', dayOfWeek: 1, startTimeUtc: '12:00:00', endTimeUtc: '21:00:00', isRecurring: true },
        { id: 'av-2', dayOfWeek: 2, startTimeUtc: '12:00:00', endTimeUtc: '21:00:00', isRecurring: true },
        { id: 'av-3', dayOfWeek: 3, startTimeUtc: '12:00:00', endTimeUtc: '21:00:00', isRecurring: true },
        { id: 'av-4', dayOfWeek: 4, startTimeUtc: '12:00:00', endTimeUtc: '21:00:00', isRecurring: true },
        { id: 'av-5', dayOfWeek: 5, startTimeUtc: '12:00:00', endTimeUtc: '21:00:00', isRecurring: true },
      ],
      timeOffs: [
        {
          id: 'to-1',
          startTime: new Date(Date.now() + 86400000 * 4),
          endTime: new Date(Date.now() + 86400000 * 5),
          reason: 'Conferência de Inteligência Artificial'
        }
      ],
      subjects: [
        { subject: { id: 'sub-1', name: 'LangChain & RAG Avançado' } },
        { subject: { id: 'sub-2', name: 'Engenharia de Prompts' } },
        { subject: { id: 'sub-3', name: 'Fine-tuning de LLMs' } },
      ],
      sessions: [
        {
          id: 'demo-session-1',
          studentId: 'student-demo-id',
          status: 'confirmed',
          scheduledStart: new Date(Date.now() + 3600000 * 2),
          scheduledEnd: new Date(Date.now() + 3600000 * 3),
          student: { id: 'student-demo-id', fullName: 'Lucas Dev' },
          subject: { name: 'LangChain & RAG Avançado' }
        },
        {
          id: 'demo-session-past-1',
          studentId: 'student-demo-id',
          status: 'completed',
          scheduledStart: new Date(Date.now() - 86400000 * 2),
          scheduledEnd: new Date(Date.now() - 86400000 * 2 + 3600000),
          student: { id: 'student-demo-id', fullName: 'Lucas Dev' },
          subject: { name: 'Engenharia de Prompts' }
        }
      ]
    };
  }

  const pastStudentsMap = new Map();
  tutorProfile.sessions.filter((s: any) => s.status === 'completed').forEach((s: any) => {
    if (s.student && !pastStudentsMap.has(s.studentId)) {
      pastStudentsMap.set(s.studentId, s.student);
    }
  });
  const pastStudents = Array.from(pastStudentsMap.values());

  const upcomingSessions = tutorProfile.sessions.filter(
    (s: any) => new Date(s.scheduledEnd) > new Date() && (s.status === 'confirmed' || s.status === 'pending_confirmation')
  );

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
        subjects={tutorProfile.subjects.map((ts: any) => ts.subject)}
        upcomingSessions={upcomingSessions}
      />
    </div>
  );
}
