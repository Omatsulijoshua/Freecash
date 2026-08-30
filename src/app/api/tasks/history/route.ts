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

    const participations = await prisma.taskParticipation.findMany({
      where: { userId: payload.userId },
      orderBy: { startedAt: 'desc' },
      include: {
        campaign: {
          include: {
            category: true,
          },
        },
        submission: true,
      },
    });

    const history = participations.map((p) => ({
      id: p.id,
      taskId: p.campaignId,
      taskTitle: p.campaign.title,
      category: p.campaign.category.name,
      reward: Number(p.campaign.rewardPerCompletion),
      status: p.status,
      startedAt: p.startedAt,
      submittedAt: p.submittedAt,
      reviewedAt: p.reviewedAt,
      proofText: p.submission?.proofText,
      evidenceUrls: p.submission?.evidenceUrls || [],
      rejectionReason: p.submission?.rejectionReason,
    }));

    return successResponse(history);
  } catch (err: any) {
    console.error('Error fetching task history:', err);
    return errorResponse('Failed to fetch task history', 500);
  }
}
