import { cookies } from 'next/headers';
import { z } from 'zod';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { evaluateFraudSignals } from '@/lib/fraud-engine';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

const evalSchema = z.object({
  targetUserId: z.string().min(1),
  proofText: z.string().optional(),
  evidenceUrls: z.array(z.string()).optional(),
  ipAddress: z.string().optional(),
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
    const validated = evalSchema.parse(body);

    const result = await evaluateFraudSignals(
      validated.targetUserId,
      validated.proofText,
      validated.evidenceUrls || [],
      validated.ipAddress
    );

    return successResponse(result, 'Fraud evaluation completed');
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return errorResponse('Invalid parameters', 422);
    }
    console.error('Error running fraud evaluation:', err);
    return errorResponse('Failed to run fraud evaluation', 500);
  }
}
