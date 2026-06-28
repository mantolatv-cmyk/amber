'use server';

import prisma from "@ailearn/database";
import { auth } from "../../../auth";
import { revalidatePath } from "next/cache";

export async function updateLearningGoals(goals: string[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado." };

  try {
    await prisma.studentProfile.upsert({
      where: { userId: session.user.id },
      update: { learningGoals: JSON.stringify(goals) },
      create: {
        userId: session.user.id,
        learningGoals: JSON.stringify(goals)
      }
    });

    revalidatePath('/dashboard/student');
    return { success: true };
  } catch (err) {
    console.error('Error updating goals:', err);
    return { error: 'Erro ao salvar objetivos.' };
  }
}
