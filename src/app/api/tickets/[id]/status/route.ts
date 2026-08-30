import { cookies } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

const updateStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED']).optional(),
  assignToMe: z.boolean().optional(),
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
    if (!payload || (payload.role !== 'SUPPORT' && payload.role !== 'ADMIN')) {
      return errorResponse('Unauthorized access', 403);
    }

    const ticketId = params.id;
    const body = await req.json();
    const validated = updateStatusSchema.parse(body);

    const updateData: any = {};
    if (validated.status) updateData.status = validated.status;
    if (validated.assignToMe) updateData.assignedToId = payload.userId;

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
    });

    return successResponse(updatedTicket, 'Ticket status updated successfully');
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return errorResponse('Invalid status parameters', 422);
    }
    console.error('Error updating ticket status:', err);
    return errorResponse('Failed to update ticket status', 500);
  }
}
