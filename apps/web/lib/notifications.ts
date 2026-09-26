import prisma from "@ailearn/database";

export type NotificationType =
  | 'session_booked'
  | 'session_confirmed'
  | 'session_reminder'
  | 'session_cancelled'
  | 'session_started'
  | 'payment_received'
  | 'review_received'
  | 'new_message'
  | 'system';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  data?: Record<string, any>;
}

/**
 * Creates an in-app notification for a given user.
 */
export async function createNotification({
  userId,
  type,
  title,
  body,
  data = {},
}: CreateNotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        data,
        isRead: false,
      },
    });
  } catch (error) {
    console.error('Failed to create in-app notification:', error);
    return null;
  }
}
