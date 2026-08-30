import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const taskId = params.id;

    const campaign = await prisma.campaign.findUnique({
      where: { id: taskId },
      include: {
        category: true,
        advertiser: {
          select: {
            id: true,
            advertiserProfile: true,
          },
        },
      },
    });

    if (!campaign) {
      return errorResponse('Task not found', 404);
    }

    let userParticipation = null;
    let token = cookies().get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      const raw = req.headers.get('cookie');
      if (raw) {
        const match = raw.match(new RegExp(`${AUTH_COOKIE_NAME}=([^;]+)`));
        if (match) token = match[1];
      }
    }

    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        userParticipation = await prisma.taskParticipation.findFirst({
          where: {
            campaignId: taskId,
            userId: payload.userId,
          },
          include: {
            submission: true,
          },
          orderBy: { startedAt: 'desc' },
        });
      }
    }

    return successResponse({
      task: {
        id: campaign.id,
        title: campaign.title,
        description: campaign.description,
        instructions: campaign.instructions,
        destinationUrl: campaign.destinationUrl,
        reward: Number(campaign.rewardPerCompletion),
        commission: Number(campaign.commissionPerCompletion),
        category: campaign.category.name,
        categorySlug: campaign.category.slug,
        verificationMethod: campaign.verificationMethod,
        availableSlots: campaign.maxCompletions - campaign.currentCompletions,
        maxCompletions: campaign.maxCompletions,
        currentCompletions: campaign.currentCompletions,
        targetCountries: campaign.targetCountries,
        advertiser: {
          companyName: campaign.advertiser.advertiserProfile?.companyName || 'Verified Advertiser',
          verificationStatus: campaign.advertiser.advertiserProfile?.verificationStatus || 'VERIFIED',
          website: campaign.advertiser.advertiserProfile?.website,
        },
      },
      userParticipation,
    });
  } catch (err: any) {
    console.error('Error fetching task details:', err);
    return errorResponse('Failed to fetch task details', 500);
  }
}
