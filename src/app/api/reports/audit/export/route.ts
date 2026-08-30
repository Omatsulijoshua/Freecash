import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';

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

    if (!token) {
      return new Response('Unauthenticated', { status: 401 });
    }
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return new Response('Unauthorized admin access', { status: 403 });
    }

    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { actor: { select: { email: true } } },
    });

    const headers = ['Log ID', 'Admin Email', 'Action', 'Target Type', 'Target ID', 'Changes / Metadata', 'IP Address', 'Date'];
    const rows = logs.map((l) => [
      l.id,
      l.actor?.email || 'System',
      l.action,
      l.targetType,
      l.targetId || '',
      `"${(l.metadata || '').replace(/"/g, '""')}"`,
      l.ipAddress || '127.0.0.1',
      new Date(l.createdAt).toISOString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="freecash_audit_logs_${Date.now()}.csv"`,
      },
    });
  } catch (err: any) {
    console.error('Error exporting audit CSV:', err);
    return new Response('Failed to export audit CSV', { status: 500 });
  }
}
