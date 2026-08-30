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
    if (!payload || (payload.role !== 'ADVERTISER' && payload.role !== 'ADMIN')) {
      return errorResponse('Unauthorized advertiser access', 403);
    }

    const campaigns = await prisma.campaign.findMany({
      where: payload.role === 'ADMIN' ? {} : { advertiserId: payload.userId },
    });

    const wallet = await prisma.wallet.findUnique({
      where: { userId: payload.userId },
    });

    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE').length;

    let totalBudgetSum = 0;
    let totalCompletions = 0;

    campaigns.forEach((c) => {
      totalBudgetSum += Number(c.totalBudget);
      totalCompletions += c.currentCompletions;
    });

    const avgCostPerCompletion = totalCompletions > 0 ? (totalBudgetSum / totalCompletions) : 0;

    return successResponse({
      totalCampaigns,
      activeCampaigns,
      totalSpent: totalBudgetSum,
      remainingBalance: wallet ? Number(wallet.balance) : 0,
      totalCompletions,
      avgCostPerCompletion,
    });
  } catch (err: any) {
    console.error('Error fetching advertiser analytics:', err);
    return errorResponse('Failed to fetch analytics', 500);
  }
}
