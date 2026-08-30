import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { comparePasswords, generateToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
      include: { profile: true },
    });

    if (!user) {
      return errorResponse('Invalid credentials', 401);
    }

    if (user.status === 'SUSPENDED') {
      return errorResponse('Your account has been suspended. Please contact support.', 403);
    }

    const isPasswordValid = await comparePasswords(validated.password, user.passwordHash);

    if (!isPasswordValid) {
      return errorResponse('Invalid credentials', 401);
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      referralCode: user.referralCode,
    };

    const token = await generateToken(tokenPayload);

    const response = successResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          referralCode: user.referralCode,
          fullName: user.profile?.fullName,
        },
      },
      'Login successful'
    );

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return errorResponse('Invalid input data', 422);
    }
    console.error('Login error:', err);
    return errorResponse('Internal server error during login', 500);
  }
}
