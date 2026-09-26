'use server';

import prisma from "@ailearn/database";
import { auth } from "../../../auth";
import { revalidatePath } from "next/cache";

export interface OnboardingData {
  headline: string;
  bio: string;
  yearsExperience: number;
  videoIntroUrl?: string;
  hourlyRate: number; // In BRL, e.g. 150
  enableTrial: boolean;
  trialRate?: number; // In BRL, e.g. 75
  subjectIds: string[];
  daysOfWeek: number[]; // 0-6
  startHour: string; // "09:00"
  endHour: string; // "18:00"
}

export async function submitTutorOnboarding(data: OnboardingData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Não autenticado." };
  }

  const userId = session.user.id;

  if (!data.headline || !data.bio || !data.hourlyRate || data.subjectIds.length === 0) {
    return { error: "Preencha todos os campos obrigatórios e selecione ao menos uma matéria." };
  }

  try {
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId },
    });

    if (!tutorProfile) {
      return { error: "Perfil de tutor não encontrado." };
    }

    const hourlyRateCents = Math.round(Number(data.hourlyRate) * 100);
    const trialRateCents = data.enableTrial && data.trialRate 
      ? Math.round(Number(data.trialRate) * 100) 
      : null;

    // Convert local BRT hours (UTC-3) to UTC strings
    // Simple UTC offset adjustment for standard time (e.g. 09:00 BRT -> 12:00:00 UTC)
    const toUtcString = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      const utcH = ((h || 0) + 3) % 24;
      return `${String(utcH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}:00`;
    };

    const startTimeUtc = toUtcString(data.startHour || "09:00");
    const endTimeUtc = toUtcString(data.endHour || "18:00");

    await prisma.$transaction(async (tx) => {
      // 1. Update Tutor Profile
      await tx.tutorProfile.update({
        where: { id: tutorProfile.id },
        data: {
          headline: data.headline.trim(),
          bio: data.bio.trim(),
          yearsExperience: Number(data.yearsExperience) || 1,
          videoIntroUrl: data.videoIntroUrl?.trim() || null,
          hourlyRateCents,
          trialRateCents,
          status: 'approved', // Automatically approve onboarding in development/commercial preview
        },
      });

      // 2. Re-assign subjects
      await tx.tutorSubject.deleteMany({
        where: { tutorId: tutorProfile.id },
      });

      await tx.tutorSubject.createMany({
        data: data.subjectIds.map((subjectId) => ({
          tutorId: tutorProfile.id,
          subjectId,
        })),
      });

      // 3. Set availability
      await tx.availability.deleteMany({
        where: { tutorId: tutorProfile.id },
      });

      const days = data.daysOfWeek.length > 0 ? data.daysOfWeek : [1, 2, 3, 4, 5];
      await tx.availability.createMany({
        data: days.map((dayOfWeek) => ({
          tutorId: tutorProfile.id,
          dayOfWeek,
          startTimeUtc,
          endTimeUtc,
          isRecurring: true,
        })),
      });
    });

    revalidatePath('/dashboard/tutor');
    revalidatePath('/search');
    revalidatePath(`/tutor/${tutorProfile.id}`);

    return { success: true };
  } catch (error: any) {
    console.error("Onboarding error:", error);
    return { error: "Ocorreu um erro ao salvar o perfil. Tente novamente." };
  }
}
