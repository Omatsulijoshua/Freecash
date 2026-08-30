import { cookies } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

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

    if (!token) return errorResponse('Unauthenticated', 401);
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return errorResponse('Unauthorized admin access', 403);
    }

    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });

    return successResponse(settings);
  } catch (err: any) {
    console.error('Error fetching system settings:', err);
    return errorResponse('Failed to fetch system settings', 500);
  }
}

const updateSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  description: z.string().optional(),
});

export async function PATCH(req: Request) {
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
    if (!payload || payload.role !== 'ADMIN') {
      return errorResponse('Unauthorized admin access', 403);
    }

    const body = await req.json();
    const validated = updateSettingSchema.parse(body);

    const setting = await prisma.systemSetting.upsert({
      where: { key: validated.key },
      update: { value: validated.value, description: validated.description },
      create: { key: validated.key, value: validated.value, description: validated.description || '' },
    });

    await prisma.auditLog.create({
      data: {
        actorId: payload.userId,
        action: 'SYSTEM_SETTING_UPDATE',
        targetType: 'SystemSetting',
        targetId: setting.id,
        metadata: JSON.stringify({ key: validated.key, newValue: validated.value }),
      },
    });

    return successResponse(setting, `System setting '${validated.key}' updated to '${validated.value}'`);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return errorResponse('Invalid parameters', 422);
    }
    console.error('Error updating system setting:', err);
    return errorResponse('Failed to update system setting', 500);
  }
}
