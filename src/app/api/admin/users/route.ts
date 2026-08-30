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
    if (!payload || payload.role !== 'ADMIN') {
      return errorResponse('Unauthorized admin access', 403);
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const query = searchParams.get('q');

    const where: any = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (query) {
      where.OR = [
        { email: { contains: query, mode: 'insensitive' } },
        { profile: { fullName: { contains: query, mode: 'insensitive' } } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        profile: true,
        wallet: true,
        _count: {
          select: { participations: true, campaigns: true },
        },
      },
    });

    const formatted = users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.profile?.fullName || u.email,
      role: u.role,
      status: u.status,
      walletBalance: Number(u.wallet?.balance || 0),
      participationsCount: u._count.participations,
      campaignsCount: u._count.campaigns,
      createdAt: u.createdAt,
    }));

    return successResponse(formatted);
  } catch (err: any) {
    console.error('Error fetching admin users:', err);
    return errorResponse('Failed to fetch users', 500);
  }
}
