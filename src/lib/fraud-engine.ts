import { prisma } from '@/lib/prisma';

const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com',
  'mailinator.com',
  'guerrillamail.com',
  '10minutemail.com',
  'dispostable.com',
  'throwawaymail.com',
  'temp-mail.org',
];

export interface FraudEvaluationResult {
  score: number;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasons: string[];
  isFlagged: boolean;
}

export async function evaluateFraudSignals(userId: string, proofText?: string, evidenceUrls: string[] = [], ipAddress?: string): Promise<FraudEvaluationResult> {
  const reasons: string[] = [];
  let score = 0;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user) {
    return { score: 0, level: 'LOW', reasons: [], isFlagged: false };
  }

  // 1. DISPOSABLE EMAIL CHECK
  const emailDomain = user.email.split('@')[1]?.toLowerCase();
  if (emailDomain && DISPOSABLE_EMAIL_DOMAINS.includes(emailDomain)) {
    score += 40;
    reasons.push(`Disposable email domain detected (@${emailDomain})`);
  }

  // 2. DUPLICATE PROOF TEXT CHECK
  if (proofText && proofText.trim().length > 5) {
    const duplicateProof = await prisma.taskSubmission.findFirst({
      where: {
        proofText: proofText.trim(),
        participation: {
          userId: { not: userId },
        },
      },
    });

    if (duplicateProof) {
      score += 50;
      reasons.push('Duplicate proof text submitted across multiple accounts');
    }
  }

  // 3. DUPLICATE EVIDENCE URL CHECK
  if (evidenceUrls.length > 0) {
    const duplicateUrl = await prisma.taskSubmission.findFirst({
      where: {
        evidenceUrls: { hasSome: evidenceUrls },
        participation: {
          userId: { not: userId },
        },
      },
    });

    if (duplicateUrl) {
      score += 60;
      reasons.push('Duplicate screenshot evidence URL submitted across multiple accounts');
    }
  }

  // 4. IP VELOCITY CHECK
  if (ipAddress) {
    const sameIpEvents = await prisma.fraudEvent.count({
      where: {
        ipAddress,
        userId: { not: userId },
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (sameIpEvents >= 3) {
      score += 30;
      reasons.push(`Multiple account actions detected from IP ${ipAddress}`);
    }
  }

  const level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' =
    score >= 80 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW';

  const isFlagged = score >= 50;

  // Persist Fraud Event & Score if risk score > 0
  if (score > 0) {
    await prisma.$transaction([
      prisma.fraudEvent.create({
        data: {
          userId: user.id,
          signalType: isFlagged ? 'DUPLICATE_PROOF' : 'ELEVATED_RISK',
          severity: level,
          description: reasons.join('; '),
          ipAddress: ipAddress || '127.0.0.1',
        },
      }),
      prisma.fraudScore.create({
        data: {
          userId: user.id,
          score,
          level,
          reasons,
        },
      }),
    ]);

    if (isFlagged && user.status !== 'SUSPENDED') {
      await prisma.user.update({
        where: { id: user.id },
        data: { status: 'FLAGGED' },
      });
    }
  }

  return { score, level, reasons, isFlagged };
}
