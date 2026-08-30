import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

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

    if (!token) {
      return new Response('Unauthenticated', { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload || (payload.role !== 'ADVERTISER' && payload.role !== 'ADMIN')) {
      return new Response('Unauthorized access', { status: 403 });
    }

    const where: any = {};
    if (payload.role === 'ADVERTISER') {
      where.advertiserId = payload.userId;
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    });

    const headers = ['Campaign Title', 'Category', 'Total Budget (NGN)', 'Reward Per Action (NGN)', 'Max Completions', 'Current Completions', 'Status', 'Created At'];
    const rows = campaigns.map((c) => [
      `"${c.title.replace(/"/g, '""')}"`,
      c.category.name,
      Number(c.totalBudget).toFixed(2),
      Number(c.rewardPerCompletion).toFixed(2),
      c.maxCompletions,
      c.currentCompletions,
      c.status,
      new Date(c.createdAt).toISOString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="freecash_campaigns_${Date.now()}.csv"`,
      },
    });
  } catch (err: any) {
    console.error('Error exporting campaigns CSV:', err);
    return new Response('Failed to export campaigns CSV', { status: 500 });
  }
}
