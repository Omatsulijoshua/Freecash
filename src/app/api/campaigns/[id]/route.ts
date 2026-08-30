import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
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

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        participations: {
          orderBy: { startedAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                profile: true,
              },
            },
            submission: true,
          },
        },
      },
    });

    if (!campaign) {
      return errorResponse('Campaign not found', 404);
    }

    if (payload.role !== 'ADMIN' && campaign.advertiserId !== payload.userId) {
      return errorResponse('Access denied to this campaign', 403);
    }

    return successResponse({
      campaign: {
        id: campaign.id,
        title: campaign.title,
        description: campaign.description,
        instructions: campaign.instructions,
        destinationUrl: campaign.destinationUrl,
        category: campaign.category.name,
        rewardPerCompletion: Number(campaign.rewardPerCompletion),
        commissionPerCompletion: Number(campaign.commissionPerCompletion),
        totalBudget: Number(campaign.totalBudget),
        maxCompletions: campaign.maxCompletions,
        currentCompletions: campaign.currentCompletions,
        status: campaign.status,
        verificationMethod: campaign.verificationMethod,
        targetCountries: campaign.targetCountries,
        createdAt: campaign.createdAt,
      },
      participations: campaign.participations.map((p) => ({
        id: p.id,
        userEmail: p.user.email,
        userName: p.user.profile?.fullName || p.user.email,
        status: p.status,
        startedAt: p.startedAt,
        submittedAt: p.submittedAt,
        proofText: p.submission?.proofText,
        evidenceUrls: p.submission?.evidenceUrls || [],
        submissionStatus: p.submission?.status,
      })),
    });
  } catch (err: any) {
    console.error('Error fetching campaign details:', err);
    return errorResponse('Failed to fetch campaign details', 500);
  }
}
