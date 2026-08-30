const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('=== STARTING PHASE 3 DATABASE & CORE MODELS AUTOMATED VERIFICATION ===\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASSED: ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAILED: ${message}`);
    }
  }

  try {
    // 1. ENTITY COUNT VERIFICATION
    console.log('--- 1. Database Table Counts ---');
    const userCount = await prisma.user.count();
    const categoryCount = await prisma.taskCategory.count();
    const campaignCount = await prisma.campaign.count();
    const participationCount = await prisma.taskParticipation.count();
    const submissionCount = await prisma.taskSubmission.count();
    const walletCount = await prisma.wallet.count();
    const transactionCount = await prisma.walletTransaction.count();
    const settingCount = await prisma.systemSetting.count();
    const ticketCount = await prisma.supportTicket.count();

    assert(userCount >= 4, `Users table populated (Found ${userCount} users)`);
    assert(categoryCount === 10, `TaskCategories populated (Found ${categoryCount} categories)`);
    assert(campaignCount >= 2, `Campaigns table populated (Found ${campaignCount} campaigns)`);
    assert(participationCount >= 1, `TaskParticipations table populated (Found ${participationCount})`);
    assert(submissionCount >= 1, `TaskSubmissions table populated (Found ${submissionCount})`);
    assert(walletCount >= 4, `Wallets table populated (Found ${walletCount})`);
    assert(transactionCount >= 2, `WalletTransactions ledger table populated (Found ${transactionCount})`);
    assert(settingCount >= 5, `SystemSettings table populated (Found ${settingCount})`);
    assert(ticketCount >= 1, `SupportTickets table populated (Found ${ticketCount})`);

    // 2. RELATIONSHIP NAVIGATION
    console.log('\n--- 2. Foreign Key & Relationship Navigations ---');
    const earner = await prisma.user.findUnique({
      where: { email: 'earner@freecash.com' },
      include: {
        profile: true,
        wallet: { include: { transactions: true } },
        participations: { include: { campaign: { include: { category: true } }, submission: true } },
      },
    });

    assert(Boolean(earner && earner.profile?.fullName === 'Chidi Okafor'), 'Navigated User -> UserProfile');
    assert(Boolean(earner && earner.wallet?.currency === 'NGN'), 'Navigated User -> Wallet');
    assert(Boolean(earner && earner.wallet?.transactions.length >= 2), 'Navigated Wallet -> WalletTransactions');
    assert(Boolean(earner && earner.participations.length >= 1), 'Navigated User -> TaskParticipations');
    assert(Boolean(earner && earner.participations[0].campaign.category.slug === 'app-testing'), 'Navigated Participation -> Campaign -> Category');
    assert(Boolean(earner && earner.participations[0].submission?.status === 'APPROVED'), 'Navigated Participation -> Submission');

    // 3. LEDGER BALANCE RECONCILIATION
    console.log('\n--- 3. Immutable Financial Ledger Balance Reconciliation ---');
    const earnerWallet = earner.wallet;
    const completedTxs = await prisma.walletTransaction.findMany({
      where: { walletId: earnerWallet.id, status: 'COMPLETED' },
    });

    let computedBalance = 0;
    for (const tx of completedTxs) {
      const amount = Number(tx.amount);
      if (tx.direction === 'CREDIT') computedBalance += amount;
      else if (tx.direction === 'DEBIT') computedBalance -= amount;
    }

    const cachedBalance = Number(earnerWallet.balance);
    assert(computedBalance === cachedBalance, `Ledger Sum (₦${computedBalance}) matches cached wallet balance (₦${cachedBalance})`);

    // 4. UNIQUE CONSTRAINTS VERIFICATION
    console.log('\n--- 4. Unique Constraints & Index Enforcement ---');
    let duplicateEmailFailed = false;
    try {
      await prisma.user.create({
        data: {
          email: 'earner@freecash.com', // Duplicate email
          passwordHash: 'pass',
          referralCode: 'FCUNIQUE_TEST_1',
        },
      });
    } catch (e) {
      duplicateEmailFailed = true;
    }
    assert(duplicateEmailFailed, 'Database rejected duplicate email (Unique constraint working)');

    let duplicateRefFailed = false;
    try {
      await prisma.user.create({
        data: {
          email: 'unique.test.email@freecash.com',
          passwordHash: 'pass',
          referralCode: 'FCEARN01', // Duplicate referral code
        },
      });
    } catch (e) {
      duplicateRefFailed = true;
    }
    assert(duplicateRefFailed, 'Database rejected duplicate referral code (Unique constraint working)');

    console.log(`\n==================================================`);
    console.log(`PHASE 3 SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
    console.log(`==================================================`);

    if (passedTests === totalTests) {
      console.log('\n🎉 ALL PHASE 3 DATABASE & CORE MODELS TESTS PASSED 100% PERFECTLY!');
      process.exit(0);
    } else {
      console.error('\n❌ PHASE 3 VERIFICATION FAILED!');
      process.exit(1);
    }
  } catch (err) {
    console.error('Phase 3 verification error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
