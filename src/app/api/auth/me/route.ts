import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: Request) {
  let token = cookies().get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    const rawCookie = req.headers.get('cookie');
    if (rawCookie) {
      const match = rawCookie.match(new RegExp(`${AUTH_COOKIE_NAME}=([^;]+)`));
      if (match) token = match[1];
    }
  }

  if (!token) {
    return errorResponse('Unauthenticated', 401);
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return errorResponse('Invalid or expired session', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      profile: true,
      advertiserProfile: true,
      wallet: true,
    },
  });

  if (!user || user.status === 'SUSPENDED') {
    return errorResponse('User account unavailable or suspended', 403);
  }

  return successResponse({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      referralCode: user.referralCode,
      profile: user.profile,
      advertiserProfile: user.advertiserProfile,
      wallet: user.wallet ? {
        balance: user.wallet.balance,
        pendingBalance: user.wallet.pendingBalance,
        currency: user.wallet.currency,
      } : null,
    },
  });
}
