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
    if (!payload || payload.role !== 'ADMIN') {
      return errorResponse('Unauthorized admin access', 403);
    }

    const [
      totalUsers,
      earnersCount,
      advertisersCount,
      totalCampaigns,
      activeCampaignsCount,
      totalCompletions,
      withdrawalsAgg,
      commissionsAgg,
      depositsAgg,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'EARNER' } }),
      prisma.user.count({ where: { role: 'ADVERTISER' } }),
      prisma.campaign.count(),
      prisma.campaign.count({ where: { status: 'ACTIVE' } }),
      prisma.taskParticipation.count({ where: { status: 'APPROVED' } }),
      prisma.withdrawal.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { netAmount: true },
      }),
      prisma.walletTransaction.aggregate({
        where: { type: 'COMMISSION', status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      prisma.deposit.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { netAmount: true },
      }),
    ]);

    const totalWithdrawalsAmount = Number(withdrawalsAgg._sum.netAmount || 0);
    const netRevenue = Number(commissionsAgg._sum.amount || 0);
    const totalGmv = Number(depositsAgg._sum.netAmount || 0);

    return successResponse({
      totalUsers,
      earnersCount,
      advertisersCount,
      totalCampaigns,
      activeCampaignsCount,
      totalCompletions,
      totalGmv,
      netRevenue,
      totalWithdrawalsAmount,
    });
  } catch (err: any) {
    console.error('Error fetching admin analytics:', err);
    return errorResponse('Failed to fetch admin analytics', 500);
  }
}
