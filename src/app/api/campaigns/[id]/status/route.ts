import { cookies } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED']),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
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

    const body = await req.json();
    const validated = updateStatusSchema.parse(body);

    const campaign = await prisma.campaign.findUnique({ where: { id: params.id } });
    if (!campaign) return errorResponse('Campaign not found', 404);

    if (payload.role !== 'ADMIN' && campaign.advertiserId !== payload.userId) {
      return errorResponse('Access denied', 403);
    }

    const updated = await prisma.campaign.update({
      where: { id: params.id },
      data: { status: validated.status },
    });

    return successResponse({ id: updated.id, status: updated.status }, `Campaign status updated to ${updated.status}`);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return errorResponse('Invalid status parameter', 422);
    }
    return errorResponse('Failed to update campaign status', 500);
  }
}
