import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "@ailearn/database";
import { isDatabaseReachable } from "./lib/db-check";

const nextAuthResult = NextAuth({
  secret: process.env.AUTH_SECRET || "fallback_secret_for_build_only_please_change",
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        const dbOnline = await isDatabaseReachable();
        if (dbOnline) {
          try {
            const user = await prisma.user.findUnique({
              where: { email }
            });

            if (user && user.passwordHash) {
              const isPasswordValid = await compare(password, user.passwordHash);
              if (isPasswordValid) {
                return {
                  id: user.id,
                  email: user.email,
                  name: user.fullName,
                  role: user.role
                };
              }
            }
          } catch (dbError) {
            console.warn("Database error during auth, checking demo accounts:", dbError);
          }
        }

        // Demo accounts for development and instant preview (password: 123456)
        const DEMO_USERS: Record<string, { id: string; email: string; name: string; role: 'student' | 'tutor' | 'admin' }> = {
          'aluno@example.com': { 
            id: 'd0000000-0000-0000-0000-000000000001', 
            email: 'aluno@example.com', 
            name: 'João Aluno Demo', 
            role: 'student' 
          },
          'marina.costa@example.com': { 
            id: 'd0000000-0000-0000-0000-000000000002', 
            email: 'marina.costa@example.com', 
            name: 'Marina Costa', 
            role: 'tutor' 
          },
          'tutor@example.com': { 
            id: 'd0000000-0000-0000-0000-000000000002', 
            email: 'tutor@example.com', 
            name: 'Marina Costa', 
            role: 'tutor' 
          },
          'admin@openlearn.com': { 
            id: 'd0000000-0000-0000-0000-000000000003', 
            email: 'admin@openlearn.com', 
            name: 'Administrador OpenLearn', 
            role: 'admin' 
          },
        };

        if (password === '123456' && DEMO_USERS[email]) {
          return DEMO_USERS[email];
        }

        return null;
      }

    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  }
});

export const handlers = nextAuthResult.handlers;
export const auth: any = nextAuthResult.auth;
export const signIn = nextAuthResult.signIn;
export const signOut = nextAuthResult.signOut;
