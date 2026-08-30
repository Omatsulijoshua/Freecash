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
    if (!payload) return errorResponse('Invalid token', 401);

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 15));
    const skip = (page - 1) * limit;

    const type = searchParams.get('type');
    const direction = searchParams.get('direction');
    const status = searchParams.get('status');

    const wallet = await prisma.wallet.findUnique({ where: { userId: payload.userId } });
    if (!wallet) return successResponse({ transactions: [], total: 0, page, limit });

    const where: any = { walletId: wallet.id };
    if (type) where.type = type;
    if (direction) where.direction = direction;
    if (status) where.status = status;

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.walletTransaction.count({ where }),
    ]);

    const formatted = transactions.map((tx) => ({
      id: tx.id,
      reference: tx.reference,
      type: tx.type,
      direction: tx.direction,
      amount: Number(tx.amount),
      status: tx.status,
      description: tx.description,
      createdAt: tx.createdAt,
    }));

    return successResponse({
      transactions: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err: any) {
    console.error('Error fetching wallet transactions:', err);
    return errorResponse('Failed to fetch transactions', 500);
  }
}
