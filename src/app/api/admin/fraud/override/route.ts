import { cookies } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

const overrideSchema = z.object({
  targetUserId: z.string().min(1, 'targetUserId is required'),
  action: z.enum(['SUSPEND_ACCOUNT', 'UNFLAG_ACCOUNT', 'RESET_RISK_SCORE']),
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
    if (!payload || payload.role !== 'ADMIN') {
      return errorResponse('Unauthorized admin access', 403);
    }

    const body = await req.json();
    const validated = overrideSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { id: validated.targetUserId } });
    if (!user) return errorResponse('Target user not found', 404);

    if (validated.action === 'SUSPEND_ACCOUNT') {
      await prisma.user.update({
        where: { id: user.id },
        data: { status: 'SUSPENDED' },
      });
      return successResponse(null, `Account ${user.email} suspended successfully`);
    } else if (validated.action === 'UNFLAG_ACCOUNT') {
      await prisma.user.update({
        where: { id: user.id },
        data: { status: 'ACTIVE' },
      });
      return successResponse(null, `Account ${user.email} unflagged and restored to ACTIVE`);
    } else if (validated.action === 'RESET_RISK_SCORE') {
      await prisma.$transaction([
        prisma.user.update({ where: { id: user.id }, data: { status: 'ACTIVE' } }),
        prisma.fraudScore.create({
          data: {
            userId: user.id,
            score: 0,
            level: 'LOW',
            reasons: ['Admin manual risk score reset'],
          },
        }),
      ]);
      return successResponse(null, `Risk score reset to 0 for account ${user.email}`);
    }

    return errorResponse('Invalid override action', 400);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return errorResponse('Invalid parameters', 422);
    }
    console.error('Error executing admin fraud override:', err);
    return errorResponse('Failed to execute fraud override', 500);
  }
}
