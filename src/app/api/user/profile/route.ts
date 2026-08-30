import { cookies } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phoneNumber: z.string().optional(),
  country: z.string().length(2).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});

export async function GET(req: Request) {
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

  const profile = await prisma.userProfile.findUnique({
    where: { userId: payload.userId },
    include: {
      user: {
        select: {
          email: true,
          role: true,
          status: true,
          referralCode: true,
          createdAt: true,
        },
      },
    },
  });

  if (!profile) return errorResponse('Profile not found', 404);

  return successResponse(profile);
}

export async function PATCH(req: Request) {
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

  try {
    const body = await req.json();
    const validated = updateProfileSchema.parse(body);

    const updated = await prisma.userProfile.update({
      where: { userId: payload.userId },
      data: validated,
    });

    return successResponse(updated, 'Profile updated successfully');
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return errorResponse('Invalid input data', 422);
    }
    return errorResponse('Failed to update profile', 500);
  }
}
