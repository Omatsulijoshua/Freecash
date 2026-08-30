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
      include: {
        transactions: {
          where: { status: 'COMPLETED' },
        },
      },
    });

    if (!wallet) return errorResponse('Wallet not found', 404);

    let computedLedgerSum = 0;
    wallet.transactions.forEach((tx) => {
      const amount = Number(tx.amount);
      if (tx.direction === 'CREDIT') computedLedgerSum += amount;
      else if (tx.direction === 'DEBIT') computedLedgerSum -= amount;
    });

    const cachedBalance = Number(wallet.balance);
    const isReconciled = computedLedgerSum === cachedBalance;

    return successResponse({
      walletId: wallet.id,
      cachedBalance,
      computedLedgerSum,
      isReconciled,
      discrepancy: cachedBalance - computedLedgerSum,
      status: isReconciled ? 'RECONCILED' : 'DISCREPANCY_FLAGGED',
    });
  } catch (err: any) {
    console.error('Error running wallet audit:', err);
    return errorResponse('Failed to run ledger audit', 500);
  }
}
