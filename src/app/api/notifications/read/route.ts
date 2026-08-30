import { cookies } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

const readSchema = z.object({
  notificationId: z.string().optional(),
  markAll: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  try {
    let token = cookies().get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      const raw = req.headers.get('cookie');
      if (raw) {
        const match = raw.match(new RegExp(`${AUTH_COOKIE_NAME}=([^;]+)`));
        if (match) token = match[1];
      }
    }

    if (!token) return errorResponse('Unauthenticated', 401);
    const payload = await verifyToken(token);
    if (!payload) return errorResponse('Invalid token', 401);

    const body = await req.json().catch(() => ({}));
    const validated = readSchema.parse(body);

    if (validated.markAll) {
      await prisma.notification.updateMany({
        where: { userId: payload.userId, isRead: false },
        data: { isRead: true },
      });
      return successResponse(null, 'All notifications marked as read');
    }

    if (validated.notificationId) {
      await prisma.notification.updateMany({
        where: { id: validated.notificationId, userId: payload.userId },
        data: { isRead: true },
      });
      return successResponse(null, 'Notification marked as read');
    }

    // Default: Mark all as read if no specific ID provided
    await prisma.notification.updateMany({
      where: { userId: payload.userId, isRead: false },
      data: { isRead: true },
    });

    return successResponse(null, 'Notifications marked as read');
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return errorResponse('Invalid parameters', 422);
    }
    console.error('Error marking notifications as read:', err);
    return errorResponse('Failed to update notifications', 500);
  }
}
