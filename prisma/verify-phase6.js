const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

async function main() {
  console.log('=== STARTING PHASE 6 TASK VERIFICATION SYSTEM AUTOMATED VERIFICATION ===\n');

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
    // 1. AUTHENTICATE ADVERTISER & CREATE FRESH CAMPAIGN FOR TESTING
    console.log('--- 1. Authenticate Advertiser & Create Campaign ---');
    const advLogin = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: 'advertiser@freecash.com', password: 'Password123!' }
    );
    const advCookie = advLogin.cookies[0].split(';')[0];

    const campaignRes = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/campaigns', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: advCookie } },
      {
        title: `Phase 6 Verification Task ${Date.now()}`,
        description: 'Test task for verification pipeline',
        categoryId: 'app-testing',
        instructions: 'Test instructions',
        rewardPerCompletion: 600,
        maxCompletions: 10,
        verificationMethod: 'MANUAL',
        targetCountries: ['NG'],
      }
    );
    const campaignId = JSON.parse(campaignRes.body).data.campaign.id;

    // Admin approve campaign status so it becomes ACTIVE
    const adminLogin = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: 'admin@freecash.com', password: 'Password123!' }
    );
    const adminCookie = adminLogin.cookies[0].split(';')[0];

    await request(
      { hostname: '127.0.0.1', port: 3000, path: `/api/campaigns/${campaignId}/status`, method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
      { status: 'ACTIVE' }
    );

    // 2. AUTHENTICATE EARNER, START TASK & SUBMIT PROOF
    console.log('\n--- 2. Authenticate Earner & Submit Task Proof ---');
    const earnerLogin = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: 'earner@freecash.com', password: 'Password123!' }
    );
    const earnerCookie = earnerLogin.cookies[0].split(';')[0];

    // Initial Earner Balance
    const meRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/auth/me', method: 'GET', headers: { Cookie: earnerCookie } });
    const meUserData = JSON.parse(meRes.body).data.user;
    const initialBalance = Number(meUserData.wallet?.balance || 0);

    // Start Task
    await request({ hostname: '127.0.0.1', port: 3000, path: `/api/tasks/${campaignId}/start`, method: 'POST', headers: { Cookie: earnerCookie } });

    // Submit Proof
    const submitRes = await request(
      { hostname: '127.0.0.1', port: 3000, path: `/api/tasks/${campaignId}/submit`, method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: earnerCookie } },
      { proofText: 'Phase 6 Proof Confirmation ID: 99120', evidenceUrls: ['https://storage.freecash.com/evidence/p6.png'] }
    );

    const submitBody = JSON.parse(submitRes.body);
    const submissionId = submitBody.data?.submission?.id;
    assert(Boolean(submissionId), 'Created task submission for verification testing');

    // 3. QUERY ADVERTISER VERIFICATION QUEUE
    console.log('\n--- 3. Query Advertiser Verification Queue (/api/verifications/queue) ---');
    const queueRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/verifications/queue', method: 'GET', headers: { Cookie: advCookie } });
    const queueData = JSON.parse(queueRes.body);
    assert(queueRes.statusCode === 200, 'GET /api/verifications/queue status 200 OK');
    assert(Array.isArray(queueData.data) && queueData.data.length >= 1, `Found ${queueData.data?.length} pending submissions in queue`);

    // 4. EXECUTE TRANSACTIONAL REWARD PAYOUT PIPELINE
    console.log('\n--- 4. Execute Transactional Reward Review Pipeline (/api/verifications/review) ---');
    const reviewRes = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/verifications/review', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: advCookie } },
      { submissionId, action: 'APPROVE' }
    );

    const reviewData = JSON.parse(reviewRes.body);
    assert(reviewRes.statusCode === 200, 'POST /api/verifications/review status 200 OK');
    assert(reviewData.data?.updatedSubmission?.status === 'APPROVED', 'Submission status updated to APPROVED');
    assert(reviewData.data?.ledgerTx?.type === 'TASK_REWARD', 'Immutable ledger transaction created with type TASK_REWARD');

    // 5. VERIFY EARNER WALLET BALANCE CREDITED
    console.log('\n--- 5. Verify Earner Wallet Balance Reconciliation ---');
    const meResAfter = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/auth/me', method: 'GET', headers: { Cookie: earnerCookie } });
    const finalBalance = Number(JSON.parse(meResAfter.body).data.user.wallet?.balance || 0);
    const expectedBalance = initialBalance + 600;
    assert(finalBalance === expectedBalance, `Earner balance credited from ₦${initialBalance} -> ₦${finalBalance} (+₦600)`);

    // 6. TEST AUTOMATED WEBHOOK VERIFICATION ENGINE
    console.log('\n--- 6. Automated Webhook Verification Engine (/api/verifications/webhook) ---');
    // For webhook test, start task again on a second campaign
    const campaignRes2 = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/campaigns', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: advCookie } },
      {
        title: `Phase 6 Webhook Task ${Date.now()}`,
        description: 'Webhook test campaign',
        categoryId: 'app-testing',
        instructions: 'Webhook instructions',
        rewardPerCompletion: 300,
        maxCompletions: 5,
        verificationMethod: 'AUTOMATED',
        targetCountries: ['NG'],
      }
    );
    const campaignId2 = JSON.parse(campaignRes2.body).data.campaign.id;
    await request(
      { hostname: '127.0.0.1', port: 3000, path: `/api/campaigns/${campaignId2}/status`, method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
      { status: 'ACTIVE' }
    );

    const start2 = await request({ hostname: '127.0.0.1', port: 3000, path: `/api/tasks/${campaignId2}/start`, method: 'POST', headers: { Cookie: earnerCookie } });
    const p2Id = JSON.parse(start2.body).data.id;

    const webhookRes = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/verifications/webhook', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { participationId: p2Id, status: 'APPROVED', proofText: 'Automated Webhook API Test' }
    );

    const webhookData = JSON.parse(webhookRes.body);
    assert(webhookRes.statusCode === 200, 'POST /api/verifications/webhook status 200 OK');
    assert(webhookData.data?.updatedSubmission?.status === 'APPROVED', 'Webhook automatically approved task and credited earner');

    server.kill();

    console.log(`\n==================================================`);
    console.log(`PHASE 6 SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
    console.log(`==================================================`);

    if (passedTests === totalTests) {
      console.log('\n🎉 ALL PHASE 6 TASK VERIFICATION SYSTEM TESTS PASSED 100% PERFECTLY!');
      process.exit(0);
    } else {
      console.error('\n❌ PHASE 6 VERIFICATION FAILED!');
      process.exit(1);
    }
  } catch (err) {
    console.error('Phase 6 verification error:', err);
    server.kill();
    process.exit(1);
  }
}

main();
