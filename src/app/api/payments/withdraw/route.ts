import { cookies } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { generatePaymentReference } from '@/lib/payments';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

const withdrawSchema = z.object({
  amount: z.number().min(1000, 'Minimum withdrawal amount is ₦1,000'),
  bankCode: z.string().min(1, 'Bank selection is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  accountNumber: z.string().length(10, 'Account number must be 10 digits'),
  accountName: z.string().min(1, 'Account name is required'),
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
    const validated = withdrawSchema.parse(body);

    // Read min_withdrawal_amount from SystemSettings
    const minSetting = await prisma.systemSetting.findUnique({ where: { key: 'min_withdrawal_amount' } });
    const minAmount = minSetting ? Number(minSetting.value) : 1000.0;

    if (validated.amount < minAmount) {
      return errorResponse(`Minimum withdrawal amount is ₦${minAmount.toLocaleString()}`, 400);
    }

    // Read withdrawal fee fixed
    const feeSetting = await prisma.systemSetting.findUnique({ where: { key: 'withdrawal_fee_fixed' } });
    const fee = feeSetting ? Number(feeSetting.value) : 50.0;
    const netAmount = validated.amount - fee;

    const wallet = await prisma.wallet.findUnique({ where: { userId: payload.userId } });
    if (!wallet || wallet.isLocked) {
      return errorResponse('Wallet is unavailable or locked for withdrawals', 400);
    }

    const currentBalance = Number(wallet.balance);
    if (currentBalance < validated.amount) {
      return errorResponse(`Insufficient wallet balance. Available: ₦${currentBalance.toLocaleString()}`, 400);
    }

    const ref = generatePaymentReference('WITHDRAWAL');

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Withdrawal Record (status: REQUESTED)
      const withdrawal = await tx.withdrawal.create({
        data: {
          userId: payload.userId,
          amount: validated.amount,
          fee,
          netAmount,
          bankCode: validated.bankCode,
          bankName: validated.bankName,
          accountNumber: validated.accountNumber,
          accountName: validated.accountName,
          status: 'REQUESTED',
          providerReference: ref,
        },
      });

      // 2. Deduct Earner Wallet Balance (DEBIT)
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: validated.amount } },
      });

      // 3. Create Immutable Ledger Transaction (WITHDRAWAL DEBIT)
      const ledgerTx = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: payload.userId,
          type: 'WITHDRAWAL',
          amount: validated.amount,
          direction: 'DEBIT',
          status: 'COMPLETED',
          reference: ref,
          description: `Bank Withdrawal to ${validated.bankName} (${validated.accountNumber})`,
          paymentProvider: 'PAYSTACK_PAYOUT',
          providerReference: ref,
        },
      });

      return { withdrawal, updatedWallet, ledgerTx };
    });

    return successResponse(result, 'Withdrawal request submitted successfully and queued for bank payout');
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return errorResponse('Invalid withdrawal parameters', 422);
    }
    console.error('Error processing withdrawal:', err);
    return errorResponse('Failed to process withdrawal', 500);
  }
}
