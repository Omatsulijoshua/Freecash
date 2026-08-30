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
    if (!payload) {
      return new Response('Invalid token', { status: 401 });
    }

    const transactions = await prisma.walletTransaction.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['Transaction Ref', 'Type', 'Direction', 'Amount (NGN)', 'Status', 'Description', 'Date'];
    const rows = transactions.map((tx) => [
      tx.reference,
      tx.type,
      tx.direction,
      Number(tx.amount).toFixed(2),
      tx.status,
      `"${(tx.description || '').replace(/"/g, '""')}"`,
      new Date(tx.createdAt).toISOString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="freecash_transactions_${Date.now()}.csv"`,
      },
    });
  } catch (err: any) {
    console.error('Error exporting transactions CSV:', err);
    return new Response('Failed to export transactions CSV', { status: 500 });
  }
}
