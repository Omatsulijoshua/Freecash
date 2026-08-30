import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(req: Request, { params }: { params: { id: string } }) {
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

    const campaignId = params.id;
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });

    if (!campaign || campaign.status !== 'ACTIVE') {
      return errorResponse('This task is not available', 400);
    }

    if (campaign.currentCompletions >= campaign.maxCompletions) {
      return errorResponse('Task completed limit reached', 400);
    }

    // Check existing active or submitted participation
    const existing = await prisma.taskParticipation.findFirst({
      where: {
        campaignId,
        userId: payload.userId,
        status: { in: ['STARTED', 'SUBMITTED', 'APPROVED'] },
      },
    });

    if (existing) {
      if (existing.status === 'APPROVED') {
        return errorResponse('You have already completed this task', 400);
      }
      return successResponse(existing, 'Task already started');
    }

    // 2 Hours expiration timer
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const participation = await prisma.taskParticipation.create({
      data: {
        campaignId,
        userId: payload.userId,
        status: 'STARTED',
        expiresAt,
      },
    });

    return successResponse(participation, 'Task started successfully', 201);
  } catch (err: any) {
    console.error('Error starting task:', err);
    return errorResponse('Failed to start task', 500);
  }
}
