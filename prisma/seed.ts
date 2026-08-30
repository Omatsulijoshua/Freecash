import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING FREE CASH INITIAL DATABASE DATA ---');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Seed System Settings
  const settings = [
    { key: 'platform_commission_percentage', value: '20.00', description: 'Default percentage commission taken by FREE CASH' },
    { key: 'min_withdrawal_amount', value: '1000.00', description: 'Minimum wallet balance required for withdrawal (NGN)' },
    { key: 'withdrawal_fee_fixed', value: '50.00', description: 'Flat bank transfer fee for withdrawals (NGN)' },
    { key: 'referral_reward_amount', value: '100.00', description: 'Reward granted per qualified active referral (NGN)' },
    { key: 'supported_countries', value: '["NG"]', description: 'JSON list of supported country codes' },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s,
    });
  }
  console.log('✅ System Settings seeded');

  // 2. Seed Task Categories
  const categories = [
    { name: 'App Testing', slug: 'app-testing', description: 'Download, install and test mobile applications', icon: 'Smartphone' },
    { name: 'Website Testing', slug: 'website-testing', description: 'Visit websites, test features & report feedback', icon: 'Globe' },
    { name: 'Surveys', slug: 'surveys', description: 'Complete market research surveys and questionnaires', icon: 'FileSpreadsheet' },
    { name: 'Microtasks', slug: 'microtasks', description: 'Quick digital microtasks, data entry and verifications', icon: 'CheckSquare' },
    { name: 'Research & User Content', slug: 'research', description: 'Upload specified user content or participate in study groups', icon: 'UserCheck' },
  ];

  for (const c of categories) {
    await prisma.taskCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, icon: c.icon },
      create: c,
    });
  }
  console.log('✅ Task Categories seeded');

  // 3. Seed Admin Account
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@freecash.com' },
    update: {},
    create: {
      email: 'admin@freecash.com',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
      referralCode: 'FCADMIN',
      profile: {
        create: {
          fullName: 'Master Administrator',
          country: 'NG',
          currency: 'NGN',
        },
      },
      wallet: {
        create: {
          currency: 'NGN',
          balance: 0.00,
        },
      },
    },
  });
  console.log('✅ Admin Account seeded:', adminUser.email);

  // 4. Seed Support Account
  const supportUser = await prisma.user.upsert({
    where: { email: 'support@freecash.com' },
    update: {},
    create: {
      email: 'support@freecash.com',
      passwordHash,
      role: 'SUPPORT',
      status: 'ACTIVE',
      emailVerified: true,
      referralCode: 'FCSUPPORT',
      profile: {
        create: {
          fullName: 'Support Representative',
          country: 'NG',
          currency: 'NGN',
        },
      },
      wallet: {
        create: {
          currency: 'NGN',
          balance: 0.00,
        },
      },
    },
  });
  console.log('✅ Support Account seeded:', supportUser.email);

  // 5. Seed Advertiser Account
  const advertiserUser = await prisma.user.upsert({
    where: { email: 'advertiser@freecash.com' },
    update: {},
    create: {
      email: 'advertiser@freecash.com',
      passwordHash,
      role: 'ADVERTISER',
      status: 'ACTIVE',
      emailVerified: true,
      referralCode: 'FCADV01',
      profile: {
        create: {
          fullName: 'PayTech Global Admin',
          country: 'NG',
          currency: 'NGN',
        },
      },
      advertiserProfile: {
        create: {
          companyName: 'PayTech Global Ltd',
          website: 'https://paytechglobal.com',
          verificationStatus: 'VERIFIED',
        },
      },
      wallet: {
        create: {
          currency: 'NGN',
          balance: 100000.00,
        },
      },
    },
  });
  console.log('✅ Advertiser Account seeded:', advertiserUser.email);

  // 6. Seed Earner Account
  const earnerUser = await prisma.user.upsert({
    where: { email: 'earner@freecash.com' },
    update: {},
    create: {
      email: 'earner@freecash.com',
      passwordHash,
      role: 'EARNER',
      status: 'ACTIVE',
      emailVerified: true,
      referralCode: 'FCEARN01',
      profile: {
        create: {
          fullName: 'Chidi Okafor',
          phoneNumber: '+2348012345678',
          country: 'NG',
          currency: 'NGN',
        },
      },
      wallet: {
        create: {
          currency: 'NGN',
          balance: 2500.00,
          pendingBalance: 500.00,
        },
      },
    },
  });
  console.log('✅ Earner Account seeded:', earnerUser.email);

  console.log('\n--- SEEDING COMPLETED SUCCESSFULLY ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
