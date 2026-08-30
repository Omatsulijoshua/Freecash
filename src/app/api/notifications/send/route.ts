import { cookies } from 'next/headers';
import { z } from 'zod';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { createNotification } from '@/lib/notification-engine';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

const sendSchema = z.object({
  targetUserId: z.string().min(1),
  type: z.enum([
    'TASK_APPROVED',
    'TASK_REJECTED',
    'WITHDRAWAL_PROCESSED',
    'WITHDRAWAL_REJECTED',
    'REFERRAL_BONUS',
    'CAMPAIGN_COMPLETED',
    'SECURITY_ALERT',
    'SYSTEM_ANNOUNCEMENT',
  ]),
  title: z.string().min(1),
  message: z.string().min(1),
  linkUrl: z.string().optional(),
});

export async function POST(req: Request) {
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

    const body = await req.json();
    const validated = sendSchema.parse(body);

    const notification = await createNotification(
      validated.targetUserId,
      validated.type,
      validated.title,
      validated.message,
      validated.linkUrl
    );

    return successResponse(notification, 'Notification sent successfully', 201);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return errorResponse('Invalid notification parameters', 422);
    }
    console.error('Error sending notification:', err);
    return errorResponse('Failed to send notification', 500);
  }
}
