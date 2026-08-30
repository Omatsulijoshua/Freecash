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
      return errorResponse('Unauthorized admin access', 403);
    }

    const [flaggedUsers, fraudEvents, fraudScores] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [{ status: 'FLAGGED' }, { status: 'SUSPENDED' }],
        },
        include: {
          profile: true,
          fraudScores: { orderBy: { lastChecked: 'desc' }, take: 1 },
        },
      }),
      prisma.fraudEvent.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { email: true, role: true, status: true },
          },
        },
      }),
      prisma.fraudScore.findMany({
        orderBy: { score: 'desc' },
        take: 10,
        include: {
          user: { select: { email: true, status: true } },
        },
      }),
    ]);

    return successResponse({
      flaggedUsers: flaggedUsers.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.profile?.fullName || u.email,
        status: u.status,
        riskScore: u.fraudScores[0]?.score || 0,
        riskLevel: u.fraudScores[0]?.level || 'LOW',
        reasons: u.fraudScores[0]?.reasons || [],
      })),
      fraudEvents: fraudEvents.map((e) => ({
        id: e.id,
        userEmail: e.user.email,
        signalType: e.signalType,
        severity: e.severity,
        description: e.description,
        ipAddress: e.ipAddress,
        createdAt: e.createdAt,
      })),
      highRiskScores: fraudScores.map((s) => ({
        id: s.id,
        userEmail: s.user.email,
        score: s.score,
        level: s.level,
        status: s.user.status,
      })),
    });
  } catch (err: any) {
    console.error('Error fetching admin fraud logs:', err);
    return errorResponse('Failed to fetch fraud logs', 500);
  }
}
