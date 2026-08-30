import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
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

    const [totalParticipations, approvedParticipations, rejectedParticipations, walletTx] = await Promise.all([
      prisma.taskParticipation.count({ where: { userId: payload.userId } }),
      prisma.taskParticipation.count({ where: { userId: payload.userId, status: 'APPROVED' } }),
      prisma.taskParticipation.count({ where: { userId: payload.userId, status: 'REJECTED' } }),
      prisma.walletTransaction.findMany({
        where: { userId: payload.userId, status: 'COMPLETED', type: 'TASK_REWARD' },
      }),
    ]);

    const completionRate = totalParticipations > 0 ? (approvedParticipations / totalParticipations) * 100 : 0;

    let totalEarnings = 0;
    walletTx.forEach((tx) => {
      totalEarnings += Number(tx.amount);
    });

    return successResponse({
      totalParticipations,
      approvedParticipations,
      rejectedParticipations,
      completionRate: Math.round(completionRate),
      totalEarnings,
    });
  } catch (err: any) {
    console.error('Error fetching earner analytics:', err);
    return errorResponse('Failed to fetch earner analytics', 500);
  }
}
