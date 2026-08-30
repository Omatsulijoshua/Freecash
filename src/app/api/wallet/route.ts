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

    let wallet = await prisma.wallet.findUnique({
      where: { userId: payload.userId },
      include: {
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: payload.userId, currency: 'NGN', balance: 0.0 },
        include: { transactions: true },
      });
    }

    return successResponse({
      wallet: {
        id: wallet.id,
        currency: wallet.currency,
        balance: Number(wallet.balance),
        pendingBalance: Number(wallet.pendingBalance),
        isLocked: wallet.isLocked,
      },
      recentTransactions: wallet.transactions.map((tx) => ({
        id: tx.id,
        reference: tx.reference,
        type: tx.type,
        direction: tx.direction,
        amount: Number(tx.amount),
        status: tx.status,
        description: tx.description,
        createdAt: tx.createdAt,
      })),
    });
  } catch (err: any) {
    console.error('Error fetching wallet:', err);
    return errorResponse('Failed to fetch wallet', 500);
  }
}
