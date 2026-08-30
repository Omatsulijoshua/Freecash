import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

const webhookSchema = z.object({
  participationId: z.string().min(1, 'participationId is required'),
  status: z.enum(['APPROVED', 'REJECTED']).default('APPROVED'),
  secretKey: z.string().optional(),
  proofText: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = webhookSchema.parse(body);

    const participation = await prisma.taskParticipation.findUnique({
      where: { id: validated.participationId },
      include: {
        user: { include: { wallet: true } },
        campaign: true,
        submission: true,
      },
    });

    if (!participation) {
      return errorResponse('Participation session not found', 404);
    }

    // Ensure submission exists or create automated submission
    let submission = participation.submission;
    if (!submission) {
      submission = await prisma.taskSubmission.create({
        data: {
          participationId: participation.id,
          proofText: validated.proofText || 'Automated Webhook Verification',
          status: 'PENDING',
        },
      });
    }

    if (submission.status === 'APPROVED') {
      return successResponse(null, 'Already approved via automated webhook');
    }

    const earnerUser = participation.user;
    const campaign = participation.campaign;
    const rewardAmount = Number(campaign.rewardPerCompletion);

    if (validated.status === 'APPROVED') {
      const result = await prisma.$transaction(async (tx) => {
        const updatedSubmission = await tx.taskSubmission.update({
          where: { id: submission!.id },
          data: {
            status: 'APPROVED',
            reviewedAt: new Date(),
          },
        });

        await tx.taskParticipation.update({
          where: { id: participation.id },
          data: {
            status: 'APPROVED',
            reviewedAt: new Date(),
          },
        });

        const updatedCampaign = await tx.campaign.update({
          where: { id: campaign.id },
          data: { currentCompletions: { increment: 1 } },
        });

        if (updatedCampaign.currentCompletions >= updatedCampaign.maxCompletions) {
          await tx.campaign.update({
            where: { id: campaign.id },
            data: { status: 'COMPLETED' },
          });
        }

        let earnerWallet = earnerUser.wallet;
        if (!earnerWallet) {
          earnerWallet = await tx.wallet.create({
            data: { userId: earnerUser.id, currency: 'NGN', balance: 0.0 },
          });
        }

        const refCode = `TX-AUTO-${Date.now()}-${submission!.id.substring(0, 6)}`;
        const ledgerTx = await tx.walletTransaction.create({
          data: {
            walletId: earnerWallet.id,
            userId: earnerUser.id,
            type: 'TASK_REWARD',
            amount: rewardAmount,
            direction: 'CREDIT',
            status: 'COMPLETED',
            reference: refCode,
            description: `Automated Webhook Reward: "${campaign.title}"`,
            relatedTaskId: campaign.id,
            relatedCampaignId: campaign.id,
          },
        });

        await tx.wallet.update({
          where: { id: earnerWallet.id },
          data: { balance: { increment: rewardAmount } },
        });

        return { updatedSubmission, ledgerTx };
      });

      return successResponse(result, 'Automated verification approved and wallet credited', 200);
    } else {
      await prisma.taskSubmission.update({
        where: { id: submission.id },
        data: { status: 'REJECTED', rejectionReason: 'Automated API check failed' },
      });
      await prisma.taskParticipation.update({
        where: { id: participation.id },
        data: { status: 'REJECTED' },
      });
      return successResponse(null, 'Automated verification rejected');
    }
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return errorResponse('Invalid webhook payload parameters', 422);
    }
    console.error('Error handling webhook verification:', err);
    return errorResponse('Failed to process webhook verification', 500);
  }
}
