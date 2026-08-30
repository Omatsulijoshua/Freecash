const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('=== STARTING PHASE 9 REFERRAL & GROWTH ENGINE AUTOMATED VERIFICATION ===\n');

  const nextBin = path.join('c:', 'Users', 'Joshua', 'Desktop', 'freecash', 'node_modules', 'next', 'dist', 'bin', 'next');

  const server = spawn('node', [nextBin, 'dev', '-H', '127.0.0.1', '-p', '3000'], {
    cwd: 'c:\\Users\\Joshua\\Desktop\\freecash',
  });

  server.stdout?.on('data', (d) => console.log('[Server]', d.toString().trim()));
  server.stderr?.on('data', (d) => console.error('[Server Err]', d.toString().trim()));

  function request(options, postData = null) {
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          const cookieHeader = res.headers['set-cookie'];
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            cookies: cookieHeader || [],
            body,
          });
        });
      });
      req.on('error', reject);
      if (postData) req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
      req.end();
    });
  }

  let isReady = false;
  for (let i = 0; i < 20; i++) {
    try {
      await new Promise((r) => setTimeout(r, 1000));
      const res = await request({
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/health',
        method: 'GET',
      });
      if (res.statusCode === 200) {
        isReady = true;
        console.log(`✓ Dev server ready in ${i + 1} seconds\n`);
        break;
      }
    } catch (e) {}
  }

  if (!isReady) {
    console.error('❌ Server failed to start');
    server.kill();
    process.exit(1);
  }

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
    // 1. REGISTER NEW REFEREE USER WITH REFERRER'S CODE (FCEARN01)
    console.log('--- 1. Register Referee User with Referral Code (FCEARN01) ---');
    const refereeEmail = `referee.${Date.now()}@freecash.com`;
    const regRes = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      {
        fullName: 'Test Referee User',
        email: refereeEmail,
        password: 'Password123!',
        role: 'EARNER',
        referralCode: 'FCEARN01',
      }
    );

    assert(regRes.statusCode === 201, 'Referee registered with status 201 Created');

    // 2. AUTHENTICATE REFERRER (earner@freecash.com) & FETCH REFERRAL METRICS
    console.log('\n--- 2. Fetch Referrer Metrics (/api/referrals) ---');
    const loginRes = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: 'earner@freecash.com', password: 'Password123!' }
    );
    const referrerCookie = loginRes.cookies[0].split(';')[0];

    const refRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/referrals', method: 'GET', headers: { Cookie: referrerCookie } });
    const refData = JSON.parse(refRes.body);
    assert(refRes.statusCode === 200, 'GET /api/referrals status 200 OK');
    assert(refData.data?.totalReferrals >= 1, `Referral count updated (Found ${refData.data?.totalReferrals} referrals)`);
    assert(Boolean(refData.data?.referralLink), `Generated shareable link: ${refData.data?.referralLink}`);

    // 3. SEED QUALIFIED REFERRAL REWARD
    console.log('\n--- 3. Seed Qualified Referral Reward Record ---');
    const referrerUser = await prisma.user.findUnique({ where: { email: 'earner@freecash.com' } });
    const refereeUser = await prisma.user.findUnique({ where: { email: refereeEmail } });

    await prisma.referralReward.upsert({
      where: { refereeId: refereeUser.id },
      update: { rewardStatus: 'QUALIFIED', earnedAmount: 100.0 },
      create: {
        referrerId: referrerUser.id,
        refereeId: refereeUser.id,
        earnedAmount: 100.0,
        rewardStatus: 'QUALIFIED',
      },
    });

    // 4. CLAIM REFERRAL REWARD BONUS (/api/referrals/claim)
    console.log('\n--- 4. Claim Referral Reward Bonus (/api/referrals/claim) ---');
    const meResBefore = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/auth/me', method: 'GET', headers: { Cookie: referrerCookie } });
    const initialBal = Number(JSON.parse(meResBefore.body).data.user.wallet?.balance || 0);

    const claimRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/referrals/claim', method: 'POST', headers: { Cookie: referrerCookie } });
    const claimData = JSON.parse(claimRes.body);
    assert(claimRes.statusCode === 200, 'POST /api/referrals/claim status 200 OK');
    assert(claimData.data?.claimedAmount === 100, 'Claimed ₦100 referral reward bonus');
    assert(claimData.data?.ledgerTx?.type === 'REFERRAL_REWARD', 'Created REFERRAL_REWARD ledger transaction entry');

    // 5. VERIFY REFERRER WALLET CREDITED
    console.log('\n--- 5. Verify Referrer Wallet Balance Reconciliation ---');
    const meResAfter = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/auth/me', method: 'GET', headers: { Cookie: referrerCookie } });
    const finalBal = Number(JSON.parse(meResAfter.body).data.user.wallet?.balance || 0);
    assert(finalBal === initialBal + 100, `Referrer wallet credited: ₦${initialBal} -> ₦${finalBal} (+₦100)`);

    server.kill();

    console.log(`\n==================================================`);
    console.log(`PHASE 9 SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
    console.log(`==================================================`);

    if (passedTests === totalTests) {
      console.log('\n🎉 ALL PHASE 9 REFERRAL & GROWTH ENGINE TESTS PASSED 100% PERFECTLY!');
      process.exit(0);
    } else {
      console.error('\n❌ PHASE 9 VERIFICATION FAILED!');
      process.exit(1);
    }
  } catch (err) {
    console.error('Phase 9 verification error:', err);
    server.kill();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
