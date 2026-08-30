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

    const wallet = await prisma.wallet.findUnique({
      where: { userId: payload.userId },
      include: { transactions: { where: { status: 'COMPLETED' } } },
    });

    if (!wallet) {
      return successResponse({
        currentBalance: 0,
        pendingBalance: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
      });
    }

    let totalEarned = 0;
    let totalWithdrawn = 0;

    wallet.transactions.forEach((tx) => {
      const amount = Number(tx.amount);
      if (tx.direction === 'CREDIT' && (tx.type === 'TASK_REWARD' || tx.type === 'BONUS' || tx.type === 'REFERRAL_REWARD')) {
        totalEarned += amount;
      }
      if (tx.direction === 'DEBIT' && tx.type === 'WITHDRAWAL') {
        totalWithdrawn += amount;
      }
    });

    return successResponse({
      currentBalance: Number(wallet.balance),
      pendingBalance: Number(wallet.pendingBalance),
      totalEarned,
      totalWithdrawn,
      currency: wallet.currency,
    });
  } catch (err: any) {
    console.error('Error fetching wallet summary:', err);
    return errorResponse('Failed to fetch wallet summary', 500);
  }
}
