import { cookies } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

const submitSchema = z.object({
  proofText: z.string().optional(),
  evidenceUrls: z.array(z.string().url()).optional().default([]),
});

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

    const body = await req.json();
    const validated = submitSchema.parse(body);

    if (!validated.proofText && (!validated.evidenceUrls || validated.evidenceUrls.length === 0)) {
      return errorResponse('Proof text or at least one screenshot URL is required', 400);
    }

    const campaignId = params.id;
    const participation = await prisma.taskParticipation.findFirst({
      where: {
        campaignId,
        userId: payload.userId,
        status: 'STARTED',
      },
    });

    if (!participation) {
      return errorResponse('No active task session found to submit. Please click Start Task first.', 400);
    }

    // Atomic update of participation + submission
    const result = await prisma.$transaction(async (tx) => {
      const updatedParticipation = await tx.taskParticipation.update({
        where: { id: participation.id },
        data: {
          status: 'SUBMITTED',
          submittedAt: new Date(),
        },
      });

      const submission = await tx.taskSubmission.upsert({
        where: { participationId: participation.id },
        update: {
          proofText: validated.proofText,
          evidenceUrls: validated.evidenceUrls,
          status: 'PENDING',
          submittedAt: new Date(),
        },
        create: {
          participationId: participation.id,
          proofText: validated.proofText,
          evidenceUrls: validated.evidenceUrls,
          status: 'PENDING',
        },
      });

      return { participation: updatedParticipation, submission };
    });

    return successResponse(result, 'Task submission submitted successfully for review', 200);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return errorResponse('Invalid submission parameters', 422);
    }
    console.error('Error submitting task proof:', err);
    return errorResponse('Failed to submit task proof', 500);
  }
}
