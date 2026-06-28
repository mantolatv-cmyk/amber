import { NextRequest } from "next/server";

import { auth } from "../../../auth";

export interface AuthContext {
  userId: string;
  role: 'student' | 'tutor' | 'admin';
  email: string;
}

export async function requireAuth(req: NextRequest): Promise<AuthContext | null> {
  const session = await auth();
  
  if (!session?.user?.email || !session?.user?.id) {
    return null;
  }

  return {
    userId: session.user.id,
    role: (session.user as any).role || 'student',
    email: session.user.email,
  };
}

export function generateUnauthorizedResponse() {
  return Response.json(
    { error: "Unauthorized", message: "You must be logged in to perform this action." },
    { status: 401 }
  );
}

export function generateForbiddenResponse() {
  return Response.json(
    { error: "Forbidden", message: "You do not have permission to perform this action." },
    { status: 403 }
  );
}
