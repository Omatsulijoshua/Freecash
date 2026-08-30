import { cookies } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

const reviewSchema = z.object({
  submissionId: z.string().min(1, 'Submission ID is required'),
  action: z.enum(['APPROVE', 'REJECT']),
  rejectionReason: z.string().optional(),
});

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
    if (!payload || (payload.role !== 'ADVERTISER' && payload.role !== 'ADMIN' && payload.role !== 'SUPPORT')) {
      return errorResponse('Unauthorized access', 403);
    }

    const body = await req.json();
    const validated = reviewSchema.parse(body);

    const submission = await prisma.taskSubmission.findUnique({
      where: { id: validated.submissionId },
      include: {
        participation: {
          include: {
            user: {
              include: { wallet: true },
            },
            campaign: true,
          },
        },
      },
    });

    if (!submission) {
      return errorResponse('Task submission not found', 404);
    }

    if (payload.role === 'ADVERTISER' && submission.participation.campaign.advertiserId !== payload.userId) {
      return errorResponse('Unauthorized access to this campaign submission', 403);
    }

    if (submission.status !== 'PENDING') {
      return errorResponse(`Submission has already been reviewed (${submission.status})`, 400);
    }

    const earnerUser = submission.participation.user;
    const campaign = submission.participation.campaign;
    const rewardAmount = Number(campaign.rewardPerCompletion);

    if (validated.action === 'APPROVE') {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Mark Submission APPROVED
        const updatedSubmission = await tx.taskSubmission.update({
          where: { id: submission.id },
          data: {
            status: 'APPROVED',
            reviewerId: payload.userId,
            reviewedAt: new Date(),
          },
        });

        // 2. Mark Participation APPROVED
        await tx.taskParticipation.update({
          where: { id: submission.participationId },
          data: {
            status: 'APPROVED',
            reviewedAt: new Date(),
          },
        });

        // 3. Increment Campaign currentCompletions
        const updatedCampaign = await tx.campaign.update({
          where: { id: campaign.id },
          data: {
            currentCompletions: { increment: 1 },
          },
        });

        // Check if campaign limits reached
        if (updatedCampaign.currentCompletions >= updatedCampaign.maxCompletions) {
          await tx.campaign.update({
            where: { id: campaign.id },
            data: { status: 'COMPLETED' },
          });
        }

        // 4. Find or Create Earner Wallet
        let earnerWallet = earnerUser.wallet;
        if (!earnerWallet) {
          earnerWallet = await tx.wallet.create({
            data: { userId: earnerUser.id, currency: 'NGN', balance: 0.0 },
          });
        }

        // 5. Create Immutable Ledger Transaction (TASK_REWARD)
        const refCode = `TX-REWARD-${Date.now()}-${submission.id.substring(0, 6)}`;
        const ledgerTx = await tx.walletTransaction.create({
          data: {
            walletId: earnerWallet.id,
            userId: earnerUser.id,
            type: 'TASK_REWARD',
            amount: rewardAmount,
            direction: 'CREDIT',
            status: 'COMPLETED',
            reference: refCode,
            description: `Reward for completed task: "${campaign.title}"`,
            relatedTaskId: campaign.id,
            relatedCampaignId: campaign.id,
          },
        });

        // 6. Credit Earner Wallet Balance
        const updatedWallet = await tx.wallet.update({
          where: { id: earnerWallet.id },
          data: {
            balance: { increment: rewardAmount },
          },
        });

        // 7. Referral Reward Check (if earner was referred by someone)
        if (earnerUser.referredById) {
          const refRewardSetting = await tx.systemSetting.findUnique({ where: { key: 'referral_reward_amount' } });
          const refBonusAmount = refRewardSetting ? Number(refRewardSetting.value) : 100.0;

          await tx.referralReward.upsert({
            where: { refereeId: earnerUser.id },
            update: {
              earnedAmount: { increment: refBonusAmount },
              rewardStatus: 'PAID',
            },
            create: {
              referrerId: earnerUser.referredById,
              refereeId: earnerUser.id,
              earnedAmount: refBonusAmount,
              rewardStatus: 'PAID',
            },
          });
        }

        return { updatedSubmission, updatedWallet, ledgerTx };
      });

      return successResponse(result, 'Task approved successfully and reward credited to earner wallet');
    } else {
      // REJECT ACTION
      if (!validated.rejectionReason) {
        return errorResponse('Rejection reason is required when rejecting a submission', 400);
      }

      const result = await prisma.$transaction(async (tx) => {
        const updatedSubmission = await tx.taskSubmission.update({
          where: { id: submission.id },
          data: {
            status: 'REJECTED',
            rejectionReason: validated.rejectionReason,
            reviewerId: payload.userId,
            reviewedAt: new Date(),
          },
        });

        await tx.taskParticipation.update({
          where: { id: submission.participationId },
          data: {
            status: 'REJECTED',
            reviewedAt: new Date(),
          },
        });

        return updatedSubmission;
      });

      return successResponse(result, 'Task submission rejected');
    }
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return errorResponse('Validation failed for review request', 422);
    }
    console.error('Error reviewing task submission:', err);
    return errorResponse('Failed to review task submission', 500);
  }
}
