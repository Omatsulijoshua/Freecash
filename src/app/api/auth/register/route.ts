import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken, generateReferralCode, AUTH_COOKIE_NAME } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  fullName: z.string().min(2, 'Full name is required'),
  role: z.enum(['EARNER', 'ADVERTISER']).default('EARNER'),
  companyName: z.string().optional(),
  referralCode: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (existingUser) {
      return errorResponse('An account with this email address already exists', 400);
    }

    let referrerId: string | undefined = undefined;
    if (validated.referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: validated.referralCode.toUpperCase() },
      });
      if (referrer) {
        referrerId = referrer.id;
      }
    }

    const passwordHash = await hashPassword(validated.password);
    let myReferralCode = generateReferralCode();
    
    let isCodeUnique = false;
    while (!isCodeUnique) {
      const existingCode = await prisma.user.findUnique({ where: { referralCode: myReferralCode } });
      if (!existingCode) isCodeUnique = true;
      else myReferralCode = generateReferralCode();
    }

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: validated.email.toLowerCase(),
          passwordHash,
          role: validated.role,
          referralCode: myReferralCode,
          referredById: referrerId,
        },
      });

      await tx.userProfile.create({
        data: {
          userId: user.id,
          fullName: validated.fullName,
          country: 'NG',
          currency: 'NGN',
        },
      });

      if (validated.role === 'ADVERTISER') {
        await tx.advertiserProfile.create({
          data: {
            userId: user.id,
            companyName: validated.companyName || validated.fullName,
          },
        });
      }

      await tx.wallet.create({
        data: {
          userId: user.id,
          currency: 'NGN',
          balance: 0.00,
          pendingBalance: 0.00,
        },
      });

      return user;
    });

    const tokenPayload = {
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      referralCode: newUser.referralCode,
    };

    const token = await generateToken(tokenPayload);

    const response = successResponse(
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          referralCode: newUser.referralCode,
          fullName: validated.fullName,
        },
      },
      'Account created successfully',
      201
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
      const errors: Record<string, string[]> = {};
      err.errors.forEach((e) => {
        const field = e.path.join('.');
        if (!errors[field]) errors[field] = [];
        errors[field].push(e.message);
      });
      return errorResponse('Validation failed', 422, errors);
    }
    console.error('Registration error:', err);
    return errorResponse('Internal server error during registration', 500);
  }
}
