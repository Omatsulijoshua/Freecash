import { cookies } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    const isStaff = payload.role === 'SUPPORT' || payload.role === 'ADMIN';

    const where: any = {};
    if (!isStaff) {
      where.userId = payload.userId;
    }
    if (status) where.status = status;
    if (category) where.category = category;

    const tickets = await prisma.supportTicket.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: { select: { email: true, profile: { select: { fullName: true } } } },
        assignedTo: { select: { email: true, profile: { select: { fullName: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    const formatted = tickets.map((t) => ({
      id: t.id,
      userId: t.userId,
      userEmail: t.user.email,
      userName: t.user.profile?.fullName || t.user.email,
      subject: t.subject,
      category: t.category,
      status: t.status,
      assignedTo: t.assignedTo?.email || null,
      lastMessage: t.messages[0]?.message || '',
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return successResponse(formatted);
  } catch (err: any) {
    console.error('Error fetching tickets:', err);
    return errorResponse('Failed to fetch support tickets', 500);
  }
}

const createTicketSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  category: z.enum([
    'PAYMENT_ISSUE',
    'WITHDRAWAL_ISSUE',
    'TASK_DISPUTE',
    'ACCOUNT_ISSUE',
    'VERIFICATION_ISSUE',
    'FRAUD_APPEAL',
    'OTHER',
  ]),
  message: z.string().min(10, 'Initial message must be at least 10 characters'),
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
    if (!payload) return errorResponse('Invalid token', 401);

    const body = await req.json();
    const validated = createTicketSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const ticket = await tx.supportTicket.create({
        data: {
          userId: payload.userId,
          subject: validated.subject,
          category: validated.category,
          status: 'OPEN',
        },
      });

      const message = await tx.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: payload.userId,
          message: validated.message,
        },
      });

      return { ticket, message };
    });

    return successResponse(result, 'Support ticket submitted successfully', 201);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return errorResponse('Invalid ticket parameters', 422);
    }
    console.error('Error creating ticket:', err);
    return errorResponse('Failed to create ticket', 500);
  }
}
