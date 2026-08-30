const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('=== SEEDING COMPREHENSIVE FREE CASH DATABASE DATA ===');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. SYSTEM SETTINGS
  console.log('Seeding System Settings...');
  const settings = [
    { key: 'platform_commission_percentage', value: '20.00', description: 'Default percentage commission taken by FREE CASH' },
    { key: 'min_withdrawal_amount', value: '1000.00', description: 'Minimum wallet balance required for withdrawal (NGN)' },
    { key: 'withdrawal_fee_fixed', value: '50.00', description: 'Flat bank transfer fee for withdrawals (NGN)' },
    { key: 'referral_reward_amount', value: '100.00', description: 'Reward granted per qualified active referral (NGN)' },
    { key: 'supported_countries', value: '["NG"]', description: 'JSON list of supported country codes' },
    { key: 'fraud_high_score_threshold', value: '70', description: 'Fraud risk score threshold triggering manual review hold' },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s,
    });
  }

  // 2. TASK CATEGORIES (10 Categories)
  console.log('Seeding Task Categories...');
  const categories = [
    { name: 'App Testing', slug: 'app-testing', description: 'Download, install and test mobile applications', icon: 'Smartphone' },
    { name: 'Website Testing', slug: 'website-testing', description: 'Visit websites, test features & report feedback', icon: 'Globe' },
    { name: 'Registration', slug: 'registration', description: 'Register on platforms and verify account registration', icon: 'UserCheck' },
    { name: 'Surveys', slug: 'surveys', description: 'Complete market research surveys and questionnaires', icon: 'FileSpreadsheet' },
    { name: 'Research', slug: 'research', description: 'Participate in research studies and user feedback', icon: 'Search' },
    { name: 'Games', slug: 'games', description: 'Play games to specified level milestones', icon: 'Gamepad2' },
    { name: 'Data Tasks', slug: 'data-tasks', description: 'Micro data-labeling and categorization tasks', icon: 'Database' },
    { name: 'Content Creation', slug: 'content-creation', description: 'Upload authentic user-generated content or reviews', icon: 'UploadCloud' },
    { name: 'Product Testing', slug: 'product-testing', description: 'Try digital products and provide usability feedback', icon: 'PackageCheck' },
    { name: 'Microtasks', slug: 'microtasks', description: 'Quick digital microtasks and verifications', icon: 'CheckSquare' },
  ];

  const categoryMap = {};
  for (const c of categories) {
    const cat = await prisma.taskCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, icon: c.icon },
      create: c,
    });
    categoryMap[c.slug] = cat.id;
  }

  // 3. CORE USERS
  console.log('Seeding Core Users...');
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
      profile: { create: { fullName: 'Master Administrator', country: 'NG', currency: 'NGN' } },
      wallet: { create: { currency: 'NGN', balance: 0.00 } },
    },
  });

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
      profile: { create: { fullName: 'Support Representative', country: 'NG', currency: 'NGN' } },
      wallet: { create: { currency: 'NGN', balance: 0.00 } },
    },
  });

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
      profile: { create: { fullName: 'PayTech Global Admin', country: 'NG', currency: 'NGN' } },
      advertiserProfile: { create: { companyName: 'PayTech Global Ltd', website: 'https://paytechglobal.com', verificationStatus: 'VERIFIED' } },
      wallet: { create: { currency: 'NGN', balance: 250000.00 } },
    },
  });

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
      profile: { create: { fullName: 'Chidi Okafor', phoneNumber: '+2348012345678', country: 'NG', currency: 'NGN' } },
      wallet: { create: { currency: 'NGN', balance: 2500.00, pendingBalance: 500.00 } },
    },
  });

  // Fetch earner wallet
  const earnerWallet = await prisma.wallet.findUnique({ where: { userId: earnerUser.id } });

  // 4. CAMPAIGNS
  console.log('Seeding Campaigns...');
  const campaign1 = await prisma.campaign.create({
    data: {
      advertiserId: advertiserUser.id,
      title: 'Download & Register on Kuda Bank App',
      description: 'Install Kuda Bank App on Android/iOS, create a verified account, and upload a screenshot of your home screen.',
      categoryId: categoryMap['app-testing'],
      instructions: '1. Download app from link.\n2. Complete registration.\n3. Take screenshot showing verified badge.',
      destinationUrl: 'https://kuda.com/download',
      totalBudget: 50000.00,
      rewardPerCompletion: 400.00,
      commissionPerCompletion: 100.00,
      maxCompletions: 100,
      currentCompletions: 1,
      status: 'ACTIVE',
      verificationMethod: 'MANUAL',
      targetCountries: ['NG'],
    },
  });

  const campaign2 = await prisma.campaign.create({
    data: {
      advertiserId: advertiserUser.id,
      title: 'Complete Fintech Usability Survey',
      description: 'Answer 10 short questions about digital banking experiences in Nigeria.',
      categoryId: categoryMap['surveys'],
      instructions: 'Click the link, complete all questions, and paste your submission confirmation ID.',
      destinationUrl: 'https://surveys.freecash.com/fintech-2026',
      totalBudget: 30000.00,
      rewardPerCompletion: 500.00,
      commissionPerCompletion: 100.00,
      maxCompletions: 50,
      currentCompletions: 0,
      status: 'ACTIVE',
      verificationMethod: 'HYBRID',
      targetCountries: ['NG'],
    },
  });

  // 5. TASK PARTICIPATION & SUBMISSION
  console.log('Seeding Task Participations & Submissions...');
  const participation = await prisma.taskParticipation.create({
    data: {
      campaignId: campaign1.id,
      userId: earnerUser.id,
      status: 'APPROVED',
      submittedAt: new Date(Date.now() - 86400000),
      reviewedAt: new Date(),
      submission: {
        create: {
          proofText: 'Registered successfully. User ID: KUDA-88219.',
          evidenceUrls: ['https://storage.freecash.com/evidence/kuda_proof_1.jpg'],
          status: 'APPROVED',
          reviewerId: advertiserUser.id,
          reviewedAt: new Date(),
        },
      },
    },
  });

  // 6. IMMUTABLE WALLET TRANSACTIONS (LEDGER)
  console.log('Seeding Wallet Transactions...');
  await prisma.walletTransaction.create({
    data: {
      walletId: earnerWallet.id,
      userId: earnerUser.id,
      type: 'TASK_REWARD',
      amount: 400.00,
      direction: 'CREDIT',
      status: 'COMPLETED',
      reference: `TX-REWARD-${Date.now()}-1`,
      description: `Task Reward for "${campaign1.title}"`,
      relatedCampaignId: campaign1.id,
    },
  });

  await prisma.walletTransaction.create({
    data: {
      walletId: earnerWallet.id,
      userId: earnerUser.id,
      type: 'BONUS',
      amount: 2100.00,
      direction: 'CREDIT',
      status: 'COMPLETED',
      reference: `TX-BONUS-${Date.now()}-2`,
      description: 'Welcome Sign-up Bonus',
    },
  });

  // 7. SUPPORT TICKETS
  console.log('Seeding Support Tickets...');
  await prisma.supportTicket.create({
    data: {
      userId: earnerUser.id,
      assignedToId: supportUser.id,
      subject: 'Inquiry regarding withdrawal limits',
      category: 'WITHDRAWAL_ISSUE',
      status: 'OPEN',
      messages: {
        create: [
          { senderId: earnerUser.id, message: 'Hello, what is the minimum withdrawal amount for Nigerian bank accounts?' },
          { senderId: supportUser.id, message: 'Hi Chidi! The minimum withdrawal amount is ₦1,000.' },
        ],
      },
    },
  });

  // 8. AUDIT LOGS
  console.log('Seeding Audit Logs...');
  await prisma.auditLog.create({
    data: {
      actorId: adminUser.id,
      action: 'SYSTEM_INITIALIZATION',
      targetType: 'SYSTEM',
      metadata: JSON.stringify({ version: '1.0.0', environment: 'development' }),
    },
  });

  console.log('\n🎉 ALL DATABASE MODELS SEEDED PERFECTLY!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
