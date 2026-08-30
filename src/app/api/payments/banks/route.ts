import { NextResponse } from 'next/server';
import { NIGERIAN_BANKS } from '@/lib/payments';
import { successResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET() {
  return successResponse(NIGERIAN_BANKS);
}
