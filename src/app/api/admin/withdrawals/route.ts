import { cookies } from 'next/headers';
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
    if (!payload || (payload.role !== 'ADMIN' && payload.role !== 'SUPPORT')) {
      return errorResponse('Unauthorized access', 403);
    }

    const withdrawals = await prisma.withdrawal.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: { email: true, profile: { select: { fullName: true } } },
        },
      },
    });

    const formatted = withdrawals.map((w) => ({
      id: w.id,
      userEmail: w.user.email,
      userName: w.user.profile?.fullName || w.user.email,
      amount: Number(w.amount),
      fee: Number(w.fee),
      netAmount: Number(w.netAmount),
      bankName: w.bankName,
      bankCode: w.bankCode,
      accountNumber: w.accountNumber,
      accountName: w.accountName,
      status: w.status,
      reference: w.providerReference,
      createdAt: w.createdAt,
    }));

    return successResponse(formatted);
  } catch (err: any) {
    console.error('Error fetching admin withdrawals:', err);
    return errorResponse('Failed to fetch withdrawals', 500);
  }
}
