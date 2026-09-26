'use server';

import prisma from "@ailearn/database";
import { auth } from "../../../auth";
import { hash, compare } from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado." };

  const fullName = (formData.get('firstName') as string) + ' ' + (formData.get('lastName') as string);
  const headline = formData.get('headline') as string || '';
  const bio = formData.get('bio') as string || '';

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { fullName },
    });

    // Update profile-specific fields if tutor
    const isTutor = (session.user as any).role === 'tutor';
    if (isTutor) {
      await prisma.tutorProfile.updateMany({
        where: { userId: session.user.id },
        data: { headline, bio },
      });
    }

    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (err) {
    console.error('Error updating profile:', err);
    return { error: 'Erro ao salvar perfil.' };
  }
}

export async function updatePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado." };

  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'Preencha todos os campos de senha.' };
  }

  if (newPassword !== confirmPassword) {
    return { error: 'As senhas não coincidem.' };
  }

  if (newPassword.length < 8) {
    return { error: 'A nova senha deve ter no mínimo 8 caracteres.' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user?.passwordHash) {
      return { error: 'Conta sem senha definida.' };
    }

    const isValid = await compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return { error: 'Senha atual incorreta.' };
    }

    const newHash = await hash(newPassword, 10);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { passwordHash: newHash },
    });

    return { success: true };
  } catch (err) {
    console.error('Error updating password:', err);
    return { error: 'Erro ao atualizar senha.' };
  }
}

export async function updateTimezone(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado." };

  const timezone = formData.get('timezone') as string;

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { timezone },
    });

    revalidatePath('/dashboard/settings');
    return { success: true };
  } catch (err) {
    console.error('Error updating timezone:', err);
    return { error: 'Erro ao atualizar fuso horário.' };
  }
}

export async function updateTutorSettings(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado." };

  const isTutor = (session.user as any).role === 'tutor';
  if (!isTutor) return { error: "Apenas tutores podem alterar estas configurações." };

  const headline = (formData.get('headline') as string) || '';
  const bio = (formData.get('bio') as string) || '';
  const videoIntroUrl = (formData.get('videoIntroUrl') as string) || '';
  const yearsExperience = Number(formData.get('yearsExperience')) || 1;
  const hourlyRate = Number(formData.get('hourlyRate')) || 100;
  const enableTrial = formData.get('enableTrial') === 'true' || formData.get('enableTrial') === 'on';
  const trialRate = Number(formData.get('trialRate')) || 0;
  const subjectIdsRaw = formData.get('subjectIds') as string;

  let subjectIds: string[] = [];
  try {
    subjectIds = subjectIdsRaw ? JSON.parse(subjectIdsRaw) : [];
  } catch {
    subjectIds = [];
  }

  const hourlyRateCents = Math.round(hourlyRate * 100);
  const trialRateCents = enableTrial && trialRate > 0 ? Math.round(trialRate * 100) : null;

  try {
    const tutorProfile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!tutorProfile) return { error: "Perfil de tutor não encontrado." };

    await prisma.$transaction(async (tx) => {
      await tx.tutorProfile.update({
        where: { id: tutorProfile.id },
        data: {
          headline,
          bio,
          videoIntroUrl: videoIntroUrl.trim() || null,
          yearsExperience,
          hourlyRateCents,
          trialRateCents,
        },
      });

      if (subjectIds.length > 0) {
        await tx.tutorSubject.deleteMany({
          where: { tutorId: tutorProfile.id },
        });

        await tx.tutorSubject.createMany({
          data: subjectIds.map((subjectId) => ({
            tutorId: tutorProfile.id,
            subjectId,
          })),
        });
      }
    });

    revalidatePath('/dashboard/settings');
    revalidatePath(`/tutor/${tutorProfile.id}`);
    revalidatePath('/search');

    return { success: true };
  } catch (err) {
    console.error('Error updating tutor settings:', err);
    return { error: 'Erro ao atualizar configurações do tutor.' };
  }
}
