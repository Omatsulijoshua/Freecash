import { cookies } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { generatePaymentReference } from '@/lib/payments';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

const depositInitSchema = z.object({
  amount: z.number().min(1000, 'Minimum deposit amount is ₦1,000'),
  provider: z.enum(['PAYSTACK', 'FLUTTERWAVE']).default('PAYSTACK'),
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
    if (!payload || (payload.role !== 'ADVERTISER' && payload.role !== 'ADMIN')) {
      return errorResponse('Unauthorized advertiser access', 403);
    }

    const body = await req.json();
    const validated = depositInitSchema.parse(body);

    const ref = generatePaymentReference('DEPOSIT');
    const fee = 0.0;
    const netAmount = validated.amount;

    const deposit = await prisma.deposit.create({
      data: {
        userId: payload.userId,
        amount: validated.amount,
        fee,
        netAmount,
        provider: validated.provider,
        providerReference: ref,
        status: 'PENDING',
      },
    });

    return successResponse(
      {
        depositId: deposit.id,
        reference: ref,
        amount: validated.amount,
        paymentUrl: `https://checkout.paystack.com/mock-pay-${ref}`,
      },
      'Deposit transaction initialized successfully',
      201
    );
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return errorResponse('Invalid deposit parameters', 422);
    }
    console.error('Error initializing deposit:', err);
    return errorResponse('Failed to initialize deposit', 500);
  }
}
