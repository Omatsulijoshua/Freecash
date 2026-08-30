import { checkRateLimit } from '@/lib/rate-limit';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const rate = checkRateLimit(`auth_${ip}`, 5, 60000);

  if (!rate.success) {
    return new Response(
      JSON.stringify({ success: false, error: 'Too Many Requests' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
        },
      }
    );
  }

  return successResponse({ remaining: rate.remaining });
}
