import { cookies } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

const replySchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
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

    const ticketId = params.id;
    const body = await req.json();
    const validated = replySchema.parse(body);

    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) return errorResponse('Ticket not found', 404);

    const isStaff = payload.role === 'SUPPORT' || payload.role === 'ADMIN';
    if (!isStaff && ticket.userId !== payload.userId) {
      return errorResponse('Unauthorized to reply to this ticket', 403);
    }

    const result = await prisma.$transaction(async (tx) => {
      const msg = await tx.ticketMessage.create({
        data: {
          ticketId,
          senderId: payload.userId,
          message: validated.message,
        },
      });

      const nextStatus = isStaff ? 'WAITING_USER' : 'IN_PROGRESS';

      const updatedTicket = await tx.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: nextStatus,
          updatedAt: new Date(),
        },
      });

      return { message: msg, ticket: updatedTicket };
    });

    return successResponse(result, 'Reply posted successfully', 201);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return errorResponse('Invalid reply message', 422);
    }
    console.error('Error posting ticket message:', err);
    return errorResponse('Failed to post reply message', 500);
  }
}
