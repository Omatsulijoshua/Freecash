import { prisma } from '@/lib/prisma';
import { sendTransactionalEmail } from '@/lib/email-service';

export type NotificationType =
  | 'TASK_APPROVED'
  | 'TASK_REJECTED'
  | 'WITHDRAWAL_PROCESSED'
  | 'WITHDRAWAL_REJECTED'
  | 'REFERRAL_BONUS'
  | 'CAMPAIGN_COMPLETED'
  | 'SECURITY_ALERT'
  | 'SYSTEM_ANNOUNCEMENT';

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  linkUrl?: string
) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        linkUrl,
        isRead: false,
      },
    });

    if (type === 'WITHDRAWAL_PROCESSED' || type === 'SECURITY_ALERT') {
      await sendTransactionalEmail({
        to: user.email,
        subject: title,
        template: type === 'WITHDRAWAL_PROCESSED' ? 'WITHDRAWAL_RECEIPT' : 'SECURITY_ALERT',
        data: { message, linkUrl },
      });
    }

    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
    return null;
  }
}
