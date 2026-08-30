import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

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

    const qualifiedRewards = await prisma.referralReward.findMany({
      where: {
        referrerId: payload.userId,
        rewardStatus: 'QUALIFIED',
      },
    });

    if (qualifiedRewards.length === 0) {
      return errorResponse('No claimable referral rewards available at this time', 400);
    }

    let claimTotal = 0;
    qualifiedRewards.forEach((r) => {
      claimTotal += Number(r.earnedAmount);
    });

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { wallet: true },
    });

    if (!user) return errorResponse('User not found', 404);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark ReferralRewards as PAID
      await tx.referralReward.updateMany({
        where: {
          referrerId: payload.userId,
          rewardStatus: 'QUALIFIED',
        },
        data: { rewardStatus: 'PAID' },
      });

      // 2. Find or Create Wallet
      let wallet = user.wallet;
      if (!wallet) {
        wallet = await tx.wallet.create({
          data: { userId: user.id, currency: 'NGN', balance: 0.0 },
        });
      }

      // 3. Create Immutable Ledger Transaction (REFERRAL_REWARD)
      const refCode = `TX-REF-${Date.now()}-${payload.userId.substring(0, 6)}`;
      const ledgerTx = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId: user.id,
          type: 'REFERRAL_REWARD',
          amount: claimTotal,
          direction: 'CREDIT',
          status: 'COMPLETED',
          reference: refCode,
          description: `Claimed Referral Bonus (${qualifiedRewards.length} qualified referrals)`,
        },
      });

      // 4. Credit Wallet Balance
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: claimTotal } },
      });

      return { claimedAmount: claimTotal, updatedWallet, ledgerTx };
    });

    return successResponse(result, `Successfully claimed ₦${claimTotal.toLocaleString()} referral reward bonus!`);
  } catch (err: any) {
    console.error('Error claiming referral rewards:', err);
    return errorResponse('Failed to claim referral rewards', 500);
  }
}
