import { cookies } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

const updateUserSchema = z.object({
  role: z.enum(['EARNER', 'ADVERTISER', 'ADMIN', 'SUPPORT']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'FLAGGED', 'PENDING_VERIFICATION']).optional(),
  balanceAdjustment: z.number().optional(),
  reason: z.string().min(3, 'Mandatory audit reason required for user modifications'),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
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

    const targetUserId = params.id;
    const body = await req.json();
    const validated = updateUserSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { wallet: true },
    });

    if (!user) return errorResponse('Target user not found', 404);

    const result = await prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (validated.role) updateData.role = validated.role;
      if (validated.status) updateData.status = validated.status;

      const updatedUser = await tx.user.update({
        where: { id: targetUserId },
        data: updateData,
      });

      let updatedWallet = user.wallet;

      if (validated.balanceAdjustment && validated.balanceAdjustment !== 0) {
        let wallet = user.wallet;
        if (!wallet) {
          wallet = await tx.wallet.create({
            data: { userId: targetUserId, currency: 'NGN', balance: 0.0 },
          });
        }

        const isCredit = validated.balanceAdjustment > 0;
        const absAmount = Math.abs(validated.balanceAdjustment);

        const ledgerTx = await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            userId: targetUserId,
            type: 'ADJUSTMENT',
            amount: absAmount,
            direction: isCredit ? 'CREDIT' : 'DEBIT',
            status: 'COMPLETED',
            reference: `ADJ-${Date.now()}-${targetUserId.substring(0, 4)}`,
            description: `Admin Adjustment: ${validated.reason}`,
          },
        });

        updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: isCredit ? { increment: absAmount } : { decrement: absAmount },
          },
        });
      }

      // Record Immutable Audit Log
      const auditLog = await tx.auditLog.create({
        data: {
          actorId: payload.userId,
          action: 'USER_MODIFICATION',
          targetType: 'User',
          targetId: targetUserId,
          metadata: JSON.stringify({
            previousRole: user.role,
            newRole: validated.role || user.role,
            previousStatus: user.status,
            newStatus: validated.status || user.status,
            balanceAdjustment: validated.balanceAdjustment || 0,
            reason: validated.reason,
          }),
          ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        },
      });

      return { updatedUser, updatedWallet, auditLog };
    });

    return successResponse(result, `User ${user.email} updated successfully`);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return errorResponse('Invalid parameters or missing audit reason', 422);
    }
    console.error('Error updating user:', err);
    return errorResponse('Failed to update user', 500);
  }
}
