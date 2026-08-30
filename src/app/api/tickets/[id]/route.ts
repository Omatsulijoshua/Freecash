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
    if (!payload) return errorResponse('Invalid token', 401);

    const ticketId = params.id;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { email: true, profile: { select: { fullName: true } } } },
        assignedTo: { select: { email: true, profile: { select: { fullName: true } } } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { email: true, role: true, profile: { select: { fullName: true } } } },
          },
        },
      },
    });

    if (!ticket) return errorResponse('Ticket not found', 404);

    const isStaff = payload.role === 'SUPPORT' || payload.role === 'ADMIN';
    if (!isStaff && ticket.userId !== payload.userId) {
      return errorResponse('Unauthorized access to ticket thread', 403);
    }

    return successResponse({
      id: ticket.id,
      subject: ticket.subject,
      category: ticket.category,
      status: ticket.status,
      userEmail: ticket.user.email,
      userName: ticket.user.profile?.fullName || ticket.user.email,
      assignedTo: ticket.assignedTo?.email || null,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      messages: ticket.messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderEmail: m.sender.email,
        senderName: m.sender.profile?.fullName || m.sender.email,
        senderRole: m.sender.role,
        message: m.message,
        createdAt: m.createdAt,
      })),
    });
  } catch (err: any) {
    console.error('Error fetching ticket thread:', err);
    return errorResponse('Failed to fetch ticket thread', 500);
  }
}
