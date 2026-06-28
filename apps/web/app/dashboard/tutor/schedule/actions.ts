'use server';

import prisma from "@ailearn/database";
import { auth } from "../../../../auth";
import { revalidatePath } from "next/cache";

// 1. Save Weekly Availability
export async function saveWeeklyAvailability(availability: { dayOfWeek: number, startTimeUtc: string, endTimeUtc: string }[]) {
  const session = await auth();
  if (session?.user?.role !== 'tutor') return { error: "Não autorizado." };

  const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId: session.user.id } });
  if (!tutorProfile) return { error: "Perfil não encontrado." };

  try {
    // Delete existing recurring availability
    await prisma.availability.deleteMany({
      where: { tutorId: tutorProfile.id, isRecurring: true }
    });

    // Insert new
    if (availability.length > 0) {
      await prisma.availability.createMany({
        data: availability.map(a => ({
          tutorId: tutorProfile.id,
          dayOfWeek: a.dayOfWeek,
          startTimeUtc: a.startTimeUtc,
          endTimeUtc: a.endTimeUtc,
          isRecurring: true
        }))
      });
    }

    revalidatePath('/dashboard/tutor/schedule');
    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { error: error.message || 'Erro ao salvar disponibilidade.' };
  }
}

// 2. Add TimeOff
export async function addTimeOff(startTime: Date, endTime: Date, reason?: string) {
  const session = await auth();
  if (session?.user?.role !== 'tutor') return { error: "Não autorizado." };

  const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId: session.user.id } });
  if (!tutorProfile) return { error: "Perfil não encontrado." };

  try {
    await prisma.timeOff.create({
      data: {
        tutorId: tutorProfile.id,
        startTime,
        endTime,
        reason
      }
    });

    revalidatePath('/dashboard/tutor/schedule');
    return { success: true };
  } catch (error: any) {
    return { error: 'Erro ao adicionar folga.' };
  }
}

// 3. Remove TimeOff
export async function removeTimeOff(timeOffId: string) {
  try {
    await prisma.timeOff.delete({ where: { id: timeOffId } });
    revalidatePath('/dashboard/tutor/schedule');
    return { success: true };
  } catch (error) {
    return { error: 'Erro ao remover folga.' };
  }
}

// 4. Add Extra Slot
export async function addExtraSlot(dayOfWeek: number, startTimeUtc: string, endTimeUtc: string, validFrom: Date, validUntil: Date) {
  const session = await auth();
  if (session?.user?.role !== 'tutor') return { error: "Não autorizado." };

  const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId: session.user.id } });
  if (!tutorProfile) return { error: "Perfil não encontrado." };

  try {
    await prisma.availability.create({
      data: {
        tutorId: tutorProfile.id,
        dayOfWeek,
        startTimeUtc,
        endTimeUtc,
        isRecurring: false,
        validFrom,
        validUntil
      }
    });

    revalidatePath('/dashboard/tutor/schedule');
    return { success: true };
  } catch (error: any) {
    return { error: 'Erro ao adicionar horário extra.' };
  }
}

// 5. Remove Extra Slot (Availability)
export async function removeExtraSlot(availabilityId: string) {
  try {
    await prisma.availability.delete({ where: { id: availabilityId } });
    revalidatePath('/dashboard/tutor/schedule');
    return { success: true };
  } catch (error) {
    return { error: 'Erro ao remover horário extra.' };
  }
}

// 6. Manual Booking
export async function manualBookSession(studentId: string, scheduledStart: Date, scheduledEnd: Date, subjectId: string) {
  const session = await auth();
  if (session?.user?.role !== 'tutor') return { error: "Não autorizado." };

  const tutorProfile = await prisma.tutorProfile.findUnique({ where: { userId: session.user.id } });
  if (!tutorProfile) return { error: "Perfil não encontrado." };

  const durationMinutes = Math.round((scheduledEnd.getTime() - scheduledStart.getTime()) / 60000);
  const priceCents = Math.round((tutorProfile.hourlyRateCents / 60) * durationMinutes);

  try {
    await prisma.session.create({
      data: {
        studentId,
        tutorId: tutorProfile.id,
        subjectId,
        scheduledStart,
        scheduledEnd,
        durationMinutes,
        priceCents,
        currency: tutorProfile.currency,
        status: 'confirmed', // Agendamento manual já entra como confirmado
      }
    });

    revalidatePath('/dashboard/tutor/schedule');
    revalidatePath('/dashboard/tutor');
    return { success: true };
  } catch (error: any) {
    return { error: 'Erro ao agendar aula.' };
  }
}
