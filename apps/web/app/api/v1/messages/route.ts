import { NextRequest, NextResponse } from "next/server";
import prisma from "@ailearn/database";
import { requireAuth, generateUnauthorizedResponse } from "../auth";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (!auth) return generateUnauthorizedResponse();

    const searchParams = req.nextUrl.searchParams;
    const contactId = searchParams.get("contactId");

    if (!contactId) {
      // Return contacts list
      // 1. Get all people the user has had sessions with
      const sessions = await prisma.session.findMany({
        where: { OR: [{ studentId: auth.userId }, { tutor: { userId: auth.userId } }] },
        include: {
          student: { select: { id: true, fullName: true, avatarUrl: true } },
          tutor: { include: { user: { select: { id: true, fullName: true, avatarUrl: true } } } },
        }
      });

      const contactsMap = new Map();
      sessions.forEach(s => {
        const otherUser = s.studentId === auth.userId ? s.tutor.user : s.student;
        if (!contactsMap.has(otherUser.id)) {
          contactsMap.set(otherUser.id, {
            id: otherUser.id,
            name: otherUser.fullName,
            avatarUrl: otherUser.avatarUrl,
            lastMessage: null,
          });
        }
      });

      // 2. Add latest messages to contacts
      const messages = await prisma.message.findMany({
        where: { OR: [{ senderId: auth.userId }, { receiverId: auth.userId }] },
        orderBy: { createdAt: 'desc' }
      });

      messages.forEach(m => {
        const otherId = m.senderId === auth.userId ? m.receiverId : m.senderId;
        if (contactsMap.has(otherId)) {
          const contact = contactsMap.get(otherId);
          if (!contact.lastMessage) {
            contact.lastMessage = m;
          }
        }
      });

      return NextResponse.json({ success: true, data: Array.from(contactsMap.values()) });
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

    if (!receiverId || !content) {
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

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: auth.userId,
        receiverId,
        content,
        contentPreview: content.substring(0, 195) + (content.length > 195 ? '...' : ''),
        isRead: false,
      }
    });

    return NextResponse.json({ success: true, data: message });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
