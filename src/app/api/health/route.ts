import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbLatency = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - dbStart;
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'unreachable_or_mock';
  }

  const responseTime = Date.now() - startTime;

  return successResponse(
    {
      name: 'FREE CASH API',
      status: 'healthy',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        latencyMs: dbLatency,
      },
      system: {
        uptimeSeconds: Math.floor(process.uptime()),
        responseTimeMs: responseTime,
      },
    },
    'Health check completed successfully'
  );
}
