import { NextRequest, NextResponse } from "next/server";
import prisma from "@ailearn/database";
import { requireAuth, generateUnauthorizedResponse } from "../auth";
import { createNotification } from "../../../../lib/notifications";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return generateUnauthorizedResponse();

    const searchParams = req.nextUrl.searchParams;
    const contactId = searchParams.get("contactId");
    const withUser = searchParams.get("withUser");

    if (!contactId) {
      // 1. Gather all unique user IDs from both sessions and message history
      const [sessions, userMessages] = await Promise.all([
        prisma.session.findMany({
          where: { OR: [{ studentId: auth.userId }, { tutor: { userId: auth.userId } }] },
          select: {
            studentId: true,
            tutor: { select: { userId: true } }
          }
        }),
        prisma.message.findMany({
          where: { OR: [{ senderId: auth.userId }, { receiverId: auth.userId }] },
          orderBy: { createdAt: 'desc' },
          take: 100,
        })
      ]);

      const contactUserIds = new Set<string>();

      sessions.forEach(s => {
        const otherId = s.studentId === auth.userId ? s.tutor.userId : s.studentId;
        if (otherId && otherId !== auth.userId) contactUserIds.add(otherId);
      });

      userMessages.forEach(m => {
        const otherId = m.senderId === auth.userId ? m.receiverId : m.senderId;
        if (otherId && otherId !== auth.userId) contactUserIds.add(otherId);
      });

      if (withUser && withUser !== auth.userId) {
        contactUserIds.add(withUser);
      }

      if (contactUserIds.size === 0) {
        return NextResponse.json({ success: true, data: [] });
      }

      const users = await prisma.user.findMany({
        where: { id: { in: Array.from(contactUserIds) } },
        select: { id: true, fullName: true, avatarUrl: true, role: true }
      });

      const contacts = users.map(user => {
        const lastMsg = userMessages.find(
          m => (m.senderId === user.id && m.receiverId === auth.userId) ||
               (m.receiverId === user.id && m.senderId === auth.userId)
        );

        return {
          id: user.id,
          name: user.fullName,
          avatarUrl: user.avatarUrl,
          role: user.role,
          lastMessage: lastMsg || null,
        };
      });

      // Sort contacts by latest message, then name
      contacts.sort((a, b) => {
        const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      return NextResponse.json({ success: true, data: contacts });
    }

    // Return messages for a specific contact
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: auth.userId, receiverId: contactId },
          { senderId: contactId, receiverId: auth.userId },
        ]
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return generateUnauthorizedResponse();

    const body = await req.json();
    const { receiverId, content } = body;

    if (!receiverId || !content?.trim()) {
      return NextResponse.json({ error: "Bad Request" }, { status: 400 });
    }

    // Find if a conversationId already exists between them
    const existingMessage = await prisma.message.findFirst({
      where: {
        OR: [
          { senderId: auth.userId, receiverId: receiverId },
          { senderId: receiverId, receiverId: auth.userId },
        ]
      }
    });

    const conversationId = existingMessage ? existingMessage.conversationId : randomUUID();

    const [message, sender] = await Promise.all([
      prisma.message.create({
        data: {
          conversationId,
          senderId: auth.userId,
          receiverId,
          content: content.trim(),
          contentPreview: content.trim().substring(0, 195) + (content.trim().length > 195 ? '...' : ''),
          isRead: false,
        }
      }),
      prisma.user.findUnique({
        where: { id: auth.userId },
        select: { fullName: true }
      })
    ]);

    // Send in-app notification to receiver
    await createNotification({
      userId: receiverId,
      type: 'new_message',
      title: `Nova mensagem de ${sender?.fullName || 'Usuário'}`,
      body: content.trim().substring(0, 90),
      data: { senderId: auth.userId, conversationId },
    });

    return NextResponse.json({ success: true, data: message });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
