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
