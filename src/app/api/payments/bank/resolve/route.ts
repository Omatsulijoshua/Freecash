import { cookies } from 'next/headers';
import { z } from 'zod';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { resolveBankAccount } from '@/lib/payments';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

const resolveSchema = z.object({
  bankCode: z.string().min(1, 'Bank code is required'),
  accountNumber: z.string().length(10, 'Account number must be 10 digits'),
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
    const validated = resolveSchema.parse(body);

    const result = await resolveBankAccount(validated.bankCode, validated.accountNumber);
    return successResponse(result, 'Bank account resolved successfully');
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return errorResponse('Invalid bank parameters', 422);
    }
    return errorResponse(err.message || 'Failed to resolve bank account', 400);
  }
}
