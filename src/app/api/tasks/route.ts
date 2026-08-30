import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const sort = searchParams.get('sort') || 'newest';
    const minReward = searchParams.get('minReward') ? Number(searchParams.get('minReward')) : 0;
    const maxReward = searchParams.get('maxReward') ? Number(searchParams.get('maxReward')) : 1000000;

    const where: any = {
      status: 'ACTIVE',
      rewardPerCompletion: {
        gte: minReward,
        lte: maxReward,
      },
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = {
        slug: category,
      };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'highest_reward') {
      orderBy = { rewardPerCompletion: 'desc' };
    } else if (sort === 'fastest') {
      orderBy = { rewardPerCompletion: 'asc' };
    }

    const campaigns = await prisma.campaign.findMany({
      where,
      orderBy,
      include: {
        category: true,
        advertiser: {
          select: {
            id: true,
            advertiserProfile: {
              select: {
                companyName: true,
                verificationStatus: true,
              },
            },
          },
        },
      },
    });

    const tasks = campaigns.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      reward: Number(c.rewardPerCompletion),
      commission: Number(c.commissionPerCompletion),
      category: c.category.name,
      categorySlug: c.category.slug,
      icon: c.category.icon,
      availableSlots: c.maxCompletions - c.currentCompletions,
      maxCompletions: c.maxCompletions,
      currentCompletions: c.currentCompletions,
      verificationMethod: c.verificationMethod,
      advertiserName: c.advertiser.advertiserProfile?.companyName || 'Verified Advertiser',
      advertiserVerified: c.advertiser.advertiserProfile?.verificationStatus === 'VERIFIED',
      estimatedTimeMinutes: 10,
      difficulty: Number(c.rewardPerCompletion) > 1000 ? 'Hard' : Number(c.rewardPerCompletion) > 400 ? 'Medium' : 'Easy',
      createdAt: c.createdAt,
    }));

    return successResponse(tasks);
  } catch (err: any) {
    console.error('Error fetching tasks marketplace:', err);
    return errorResponse('Failed to fetch task marketplace', 500);
  }
}
