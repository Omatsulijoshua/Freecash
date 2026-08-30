import { cookies } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken, comparePasswords, hashPassword, AUTH_COOKIE_NAME } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
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
    if (!payload) return errorResponse('Invalid token', 401);

    const body = await req.json();
    const validated = changePasswordSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return errorResponse('User not found', 404);

    const isMatch = await comparePasswords(validated.currentPassword, user.passwordHash);
    if (!isMatch) {
      return errorResponse('Current password is incorrect', 400);
    }

    const newHash = await hashPassword(validated.newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    return successResponse(null, 'Password updated successfully');
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return errorResponse('Validation failed', 422);
    }
    return errorResponse('Failed to update password', 500);
  }
}
