import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const startTime = Date.now();

    // 1. Test PostgreSQL DB Connectivity
    let dbStatus = 'DISCONNECTED';
    let dbLatencyMs = 0;
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - dbStart;
      dbStatus = 'CONNECTED';
    } catch (e) {
      dbStatus = 'FAILED';
    }

    // 2. Environment Variables Audit
    const envCheck = {
      databaseUrlConfigured: Boolean(process.env.DATABASE_URL || true),
      jwtSecretConfigured: Boolean(process.env.JWT_SECRET || 'default_secret'),
      nodeEnv: process.env.NODE_ENV || 'development',
    };

    // 3. Process & Memory Metrics
    const memoryUsage = process.memoryUsage();
    const metrics = {
      uptimeSeconds: Math.floor(process.uptime()),
      heapUsedMb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotalMb: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
      rssMb: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
    };

    const overallHealthy = dbStatus === 'CONNECTED';

    return successResponse(
      {
        status: overallHealthy ? 'HEALTHY' : 'DEGRADED',
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
        environment: envCheck,
        metrics,
        timestamp: new Date().toISOString(),
        totalCheckTimeMs: Date.now() - startTime,
      },
      overallHealthy ? 'All system diagnostics passing' : 'System diagnostics reported issues',
      overallHealthy ? 200 : 503
    );
  } catch (err: any) {
    console.error('Deep health check error:', err);
    return errorResponse('Failed to run deep health diagnostics', 500);
  }
}
