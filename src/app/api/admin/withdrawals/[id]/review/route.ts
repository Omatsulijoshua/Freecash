import { cookies } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

const reviewWithdrawalSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  rejectionReason: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
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
    if (!payload || (payload.role !== 'ADMIN' && payload.role !== 'SUPPORT')) {
      return errorResponse('Unauthorized access', 403);
    }

    const withdrawalId = params.id;
    const body = await req.json();
    const validated = reviewWithdrawalSchema.parse(body);

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { user: { include: { wallet: true } } },
    });

    if (!withdrawal) return errorResponse('Withdrawal request not found', 404);
    if (withdrawal.status !== 'REQUESTED' && withdrawal.status !== 'PROCESSING') {
      return errorResponse(`Withdrawal cannot be reviewed (current status: ${withdrawal.status})`, 400);
    }

    const amount = Number(withdrawal.amount);

    const result = await prisma.$transaction(async (tx) => {
      if (validated.action === 'APPROVE') {
        const updatedWithdrawal = await tx.withdrawal.update({
          where: { id: withdrawalId },
          data: { status: 'COMPLETED' },
        });

        const auditLog = await tx.auditLog.create({
          data: {
            actorId: payload.userId,
            action: 'WITHDRAWAL_APPROVAL',
            targetType: 'Withdrawal',
            targetId: withdrawalId,
            metadata: JSON.stringify({ status: 'COMPLETED', amount }),
          },
        });

        return { updatedWithdrawal, auditLog };
      } else {
        // REJECT & REFUND TO EARNER WALLET
        const updatedWithdrawal = await tx.withdrawal.update({
          where: { id: withdrawalId },
          data: {
            status: 'REJECTED',
            rejectionReason: validated.rejectionReason || 'Rejected by Admin',
          },
        });

        let wallet = withdrawal.user.wallet;
        if (!wallet) {
          wallet = await tx.wallet.create({
            data: { userId: withdrawal.userId, currency: 'NGN', balance: 0.0 },
          });
        }

        // Create REFUND CREDIT Ledger Transaction
        const refCode = `RFD-WTH-${Date.now()}-${withdrawalId.substring(0, 4)}`;
        const ledgerTx = await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            userId: withdrawal.userId,
            type: 'REFUND',
            amount,
            direction: 'CREDIT',
            status: 'COMPLETED',
            reference: refCode,
            description: `Withdrawal Refund: ${validated.rejectionReason || 'Admin Rejection'}`,
          },
        });

        // Credit Earner Wallet Balance
        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: amount } },
        });

        const auditLog = await tx.auditLog.create({
          data: {
            actorId: payload.userId,
            action: 'WITHDRAWAL_REJECTION',
            targetType: 'Withdrawal',
            targetId: withdrawalId,
            metadata: JSON.stringify({ status: 'REJECTED', amount, reason: validated.rejectionReason }),
          },
        });

        return { updatedWithdrawal, updatedWallet, ledgerTx, auditLog };
      }
    });

    return successResponse(result, `Withdrawal request ${validated.action === 'APPROVE' ? 'approved' : 'rejected and refunded'}`);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return errorResponse('Invalid review action', 422);
    }
    console.error('Error reviewing withdrawal:', err);
    return errorResponse('Failed to review withdrawal', 500);
  }
}
