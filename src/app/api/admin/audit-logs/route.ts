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

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        actor: {
          select: { email: true, role: true },
        },
      },
    });

    const formatted = logs.map((log) => ({
      id: log.id,
      adminEmail: log.actor?.email || 'System',
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      metadata: log.metadata,
      createdAt: log.createdAt,
    }));

    return successResponse(formatted);
  } catch (err: any) {
    console.error('Error fetching audit logs:', err);
    return errorResponse('Failed to fetch audit logs', 500);
  }
}
