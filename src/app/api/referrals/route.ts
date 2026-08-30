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

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        referrals: {
          include: {
            profile: true,
            participations: { where: { status: 'APPROVED' } },
          },
        },
      },
    });

    if (!user) return errorResponse('User not found', 404);

    // Fetch referral rewards from ReferralReward table
    const referralRewards = await prisma.referralReward.findMany({
      where: { referrerId: user.id },
    });

    let totalEarned = 0;
    let claimableBalance = 0;

    referralRewards.forEach((r) => {
      const amount = Number(r.earnedAmount);
      totalEarned += amount;
      if (r.rewardStatus === 'QUALIFIED') {
        claimableBalance += amount;
      }
    });

    const referredUsers = user.referrals.map((ref) => {
      const approvedCount = ref.participations.length;
      const isQualified = approvedCount > 0;
      return {
        id: ref.id,
        fullName: ref.profile?.fullName || ref.email,
        email: ref.email,
        joinedAt: ref.createdAt,
        completedTasks: approvedCount,
        status: isQualified ? 'Active (Qualified)' : 'Registered',
      };
    });

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const referralLink = `${protocol}://${host}/register?ref=${user.referralCode}`;

    return successResponse({
      referralCode: user.referralCode,
      referralLink,
      totalReferrals: user.referrals.length,
      activeReferrals: referredUsers.filter((u) => u.completedTasks > 0).length,
      totalEarned,
      claimableBalance,
      referredUsers,
    });
  } catch (err: any) {
    console.error('Error fetching referrals:', err);
    return errorResponse('Failed to fetch referrals', 500);
  }
}
