import { cookies } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

const verifyDepositSchema = z.object({
  reference: z.string().min(1, 'Reference is required'),
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
    if (!payload || (payload.role !== 'ADVERTISER' && payload.role !== 'ADMIN')) {
      return errorResponse('Unauthorized access', 403);
    }

    const body = await req.json();
    const validated = verifyDepositSchema.parse(body);

    const deposit = await prisma.deposit.findUnique({
      where: { providerReference: validated.reference },
      include: { user: { include: { wallet: true } } },
    });

    if (!deposit) return errorResponse('Deposit transaction not found', 404);
    if (deposit.status === 'COMPLETED') {
      return successResponse(null, 'Deposit has already been verified and credited');
    }

    const depositAmount = Number(deposit.netAmount);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Deposit status -> COMPLETED
      const updatedDeposit = await tx.deposit.update({
        where: { id: deposit.id },
        data: { status: 'COMPLETED' },
      });

      // 2. Find or create Advertiser Wallet
      let wallet = deposit.user.wallet;
      if (!wallet) {
        wallet = await tx.wallet.create({
          data: { userId: deposit.userId, currency: 'NGN', balance: 0.0 },
        });
      }

      // 3. Create Immutable Ledger Transaction (DEPOSIT)
      const ledgerTx = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: deposit.userId,
          type: 'DEPOSIT',
          amount: depositAmount,
          direction: 'CREDIT',
          status: 'COMPLETED',
          reference: deposit.providerReference,
          description: `Advertiser Account Funding via ${deposit.provider}`,
          paymentProvider: deposit.provider,
          providerReference: deposit.providerReference,
        },
      });

      // 4. Credit Advertiser Wallet Balance
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: depositAmount } },
      });

      return { updatedDeposit, updatedWallet, ledgerTx };
    });

    return successResponse(result, 'Deposit verified successfully and advertiser wallet credited');
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return errorResponse('Invalid reference', 422);
    }
    console.error('Error verifying deposit:', err);
    return errorResponse('Failed to verify deposit', 500);
  }
}
