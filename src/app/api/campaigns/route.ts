import { cookies } from 'next/headers';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

const createCampaignSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  instructions: z.string().min(10, 'Instructions are required'),
  destinationUrl: z.string().url().optional().or(z.literal('')),
  rewardPerCompletion: z.number().min(50, 'Minimum reward per completion is ₦50'),
  maxCompletions: z.number().int().min(5, 'Minimum completions count is 5'),
  verificationMethod: z.enum(['MANUAL', 'AUTOMATED', 'HYBRID']).default('MANUAL'),
  targetCountries: z.array(z.string()).default(['NG']),
});

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
    if (!payload || (payload.role !== 'ADVERTISER' && payload.role !== 'ADMIN')) {
      return errorResponse('Unauthorized advertiser access', 403);
    }

    const campaigns = await prisma.campaign.findMany({
      where: payload.role === 'ADMIN' ? {} : { advertiserId: payload.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        _count: {
          select: { participations: true },
        },
      },
    });

    const formatted = campaigns.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category.name,
      rewardPerCompletion: Number(c.rewardPerCompletion),
      commissionPerCompletion: Number(c.commissionPerCompletion),
      totalCostPerCompletion: Number(c.rewardPerCompletion) + Number(c.commissionPerCompletion),
      totalBudget: Number(c.totalBudget),
      maxCompletions: c.maxCompletions,
      currentCompletions: c.currentCompletions,
      status: c.status,
      verificationMethod: c.verificationMethod,
      createdAt: c.createdAt,
    }));

    return successResponse(formatted);
  } catch (err: any) {
    console.error('Error fetching advertiser campaigns:', err);
    return errorResponse('Failed to fetch campaigns', 500);
  }
}

export async function POST(req: Request) {
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
    if (!payload || (payload.role !== 'ADVERTISER' && payload.role !== 'ADMIN')) {
      return errorResponse('Unauthorized advertiser access', 403);
    }

    const body = await req.json();
    const validated = createCampaignSchema.parse(body);

    // Resolve Category by ID or Slug
    let category = await prisma.taskCategory.findFirst({
      where: {
        OR: [
          { id: validated.categoryId },
          { slug: validated.categoryId },
        ],
      },
    });

    if (!category) {
      // Fallback to first active category if not found
      category = await prisma.taskCategory.findFirst();
      if (!category) return errorResponse('Task category not found', 400);
    }

    // Fetch platform commission percentage from SystemSettings
    const commissionSetting = await prisma.systemSetting.findUnique({
      where: { key: 'platform_commission_percentage' },
    });
    const commissionPct = commissionSetting ? Number(commissionSetting.value) : 20.0;

    // Server-side budget calculations
    const rewardPerCompletion = validated.rewardPerCompletion;
    const commissionPerCompletion = rewardPerCompletion * (commissionPct / 100);
    const totalUserBudget = rewardPerCompletion * validated.maxCompletions;
    const totalCommission = commissionPerCompletion * validated.maxCompletions;
    const totalBudget = totalUserBudget + totalCommission;

    const newCampaign = await prisma.campaign.create({
      data: {
        advertiserId: payload.userId,
        title: validated.title,
        description: validated.description,
        categoryId: category.id,
        instructions: validated.instructions,
        destinationUrl: validated.destinationUrl,
        rewardPerCompletion,
        commissionPerCompletion,
        totalBudget,
        maxCompletions: validated.maxCompletions,
        currentCompletions: 0,
        status: payload.role === 'ADMIN' ? 'ACTIVE' : 'PENDING_REVIEW',
        verificationMethod: validated.verificationMethod,
        targetCountries: validated.targetCountries,
      },
      include: {
        category: true,
      },
    });

    return successResponse(
      {
        campaign: {
          id: newCampaign.id,
          title: newCampaign.title,
          status: newCampaign.status,
          rewardPerCompletion: Number(newCampaign.rewardPerCompletion),
          commissionPerCompletion: Number(newCampaign.commissionPerCompletion),
          totalBudget: Number(newCampaign.totalBudget),
          maxCompletions: newCampaign.maxCompletions,
        },
      },
      'Campaign created successfully and submitted for review',
      201
    );
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return errorResponse('Validation failed for campaign inputs', 422);
    }
    console.error('Error creating campaign:', err);
    return errorResponse('Failed to create campaign', 500);
  }
}
