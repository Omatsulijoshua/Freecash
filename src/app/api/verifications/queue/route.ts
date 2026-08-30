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
    if (!payload || (payload.role !== 'ADVERTISER' && payload.role !== 'ADMIN' && payload.role !== 'SUPPORT')) {
      return errorResponse('Unauthorized access', 403);
    }

    const submissions = await prisma.taskSubmission.findMany({
      where: {
        status: 'PENDING',
        participation: {
          campaign: payload.role === 'ADMIN' || payload.role === 'SUPPORT' ? {} : { advertiserId: payload.userId },
        },
      },
      orderBy: { submittedAt: 'desc' },
      include: {
        participation: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profile: true,
              },
            },
            campaign: {
              select: {
                id: true,
                title: true,
                rewardPerCompletion: true,
                category: true,
              },
            },
          },
        },
      },
    });

    const queue = submissions.map((s) => ({
      submissionId: s.id,
      participationId: s.participationId,
      campaignId: s.participation.campaign.id,
      campaignTitle: s.participation.campaign.title,
      category: s.participation.campaign.category.name,
      reward: Number(s.participation.campaign.rewardPerCompletion),
      earnerId: s.participation.user.id,
      earnerName: s.participation.user.profile?.fullName || s.participation.user.email,
      earnerEmail: s.participation.user.email,
      proofText: s.proofText,
      evidenceUrls: s.evidenceUrls || [],
      submittedAt: s.submittedAt,
    }));

    return successResponse(queue);
  } catch (err: any) {
    console.error('Error fetching verification queue:', err);
    return errorResponse('Failed to fetch verification queue', 500);
  }
}
