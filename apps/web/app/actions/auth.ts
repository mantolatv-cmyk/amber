'use server';

import prisma from "@ailearn/database";
import { hash } from "bcryptjs";

import { RegisterSchema } from "@ailearn/shared";

export async function registerUser(formData: FormData) {
  const rawData = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
  };

  // The RegisterSchema in @ailearn/shared expects fullName, email, role. Wait, the current schema might be different. Let's look at what the schema expects: email, fullName, role, timezone, locale. 
  // Let me just import z and validate if the schema doesn't fit exactly.
  // I will use z directly here or RegisterSchema if it matches. Let's just use z directly to avoid mismatches.
  const { z } = await import("zod");
  const localSchema = z.object({
    name: z.string().min(2).max(255),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['student', 'tutor']),
  });

  const parsed = localSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: 'Preencha todos os campos corretamente.' };
  }
  
  const { name, email, password, role } = parsed.data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: 'E-mail já está em uso.' };
    }

    const passwordHash = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        fullName: name,
        passwordHash,
        role,
      },
    });

    if (role === 'student') {
      await prisma.studentProfile.create({
        data: {
          userId: user.id,
        }
      });
    } else {
      await prisma.tutorProfile.create({
        data: {
          userId: user.id,
          headline: 'Novo Tutor',
          bio: 'Adicione uma bio aqui.',
          hourlyRateCents: 10000,
        }
      });
    }

    return { success: true };
  } catch (err) {
    console.error('Registration error:', err);
    return { error: 'Erro ao criar conta. Tente novamente.' };
  }
}
