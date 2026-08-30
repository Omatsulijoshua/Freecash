const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

async function main() {
  console.log('=== STARTING PHASE 5 ADVERTISER SYSTEM AUTOMATED VERIFICATION ===\n');

  const nextBin = path.join('c:', 'Users', 'Joshua', 'Desktop', 'freecash', 'node_modules', 'next', 'dist', 'bin', 'next');

  // Spawn local dev server
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

  // Poll server readiness
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
    // 1. AUTHENTICATE SEEDED ADVERTISER
    console.log('--- 1. Authenticate Seeded Advertiser ---');
    const loginRes = await request(
      {
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        email: 'advertiser@freecash.com',
        password: 'Password123!',
      }
    );

    assert(loginRes.statusCode === 200, `Advertiser login status 200 OK (got ${loginRes.statusCode})`);
    const sessionCookie = loginRes.cookies ? loginRes.cookies[0].split(';')[0] : '';
    assert(sessionCookie.startsWith('freecash_session='), 'Session cookie obtained for advertiser');

    // 2. ADVERTISER ANALYTICS
    console.log('\n--- 2. Advertiser Analytics API (/api/advertiser/analytics) ---');
    const analyticsRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/advertiser/analytics',
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });

    const analyticsData = JSON.parse(analyticsRes.body);
    assert(analyticsRes.statusCode === 200, 'GET /api/advertiser/analytics status 200 OK');
    assert(typeof analyticsData.data?.totalCampaigns === 'number', 'Returned aggregate totalCampaigns');
    assert(typeof analyticsData.data?.remainingBalance === 'number', `Advertiser wallet balance available (₦${analyticsData.data?.remainingBalance})`);

    // 3. CREATE CAMPAIGN WIZARD API WITH SERVER-SIDE BUDGET CALCULATIONS
    console.log('\n--- 3. Campaign Creation Wizard API (POST /api/campaigns) ---');
    // First get a category ID
    const catRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/tasks', method: 'GET' });
    const catData = JSON.parse(catRes.body);
    const categoryId = catData.data?.[0]?.categorySlug || 'app-testing';

    // Fetch categories table to get first category ID
    const createRes = await request(
      {
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/campaigns',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie,
        },
      },
      {
        title: 'Phase 5 Test Campaign — Test App Registration',
        description: 'Download app and complete user registration workflow.',
        categoryId: 'app-testing',
        instructions: '1. Install app\n2. Register account\n3. Upload proof.',
        destinationUrl: 'https://example.com/app',
        rewardPerCompletion: 500, // ₦500
        maxCompletions: 100, // 100 completions
        verificationMethod: 'MANUAL',
        targetCountries: ['NG'],
      }
    );

    const createData = JSON.parse(createRes.body);
    assert(createRes.statusCode === 201, `Create campaign status 201 Created (got ${createRes.statusCode})`);
    const createdCampaign = createData.data?.campaign;
    assert(Boolean(createdCampaign?.id), 'Created campaign record ID returned');
    assert(createdCampaign?.rewardPerCompletion === 500, 'Earner reward per action is ₦500');
    assert(createdCampaign?.commissionPerCompletion === 100, 'Server calculated 20% platform commission (₦100/task)');
    assert(createdCampaign?.totalBudget === 60000, 'Server calculated total required budget (₦500 + ₦100) * 100 = ₦60,000');

    // 4. LIST ADVERTISER CAMPAIGNS
    console.log('\n--- 4. List Advertiser Campaigns (GET /api/campaigns) ---');
    const listRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/campaigns',
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });

    const listData = JSON.parse(listRes.body);
    assert(listRes.statusCode === 200, 'GET /api/campaigns status 200 OK');
    assert(Array.isArray(listData.data) && listData.data.length >= 1, `Found ${listData.data?.length} advertiser campaigns`);

    // 5. UPDATE CAMPAIGN STATUS (PAUSE & RESUME)
    console.log('\n--- 5. Toggle Campaign Status (PATCH /api/campaigns/[id]/status) ---');
    const pauseRes = await request(
      {
        hostname: '127.0.0.1',
        port: 3000,
        path: `/api/campaigns/${createdCampaign.id}/status`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie,
        },
      },
      { status: 'PAUSED' }
    );

    const pauseData = JSON.parse(pauseRes.body);
    assert(pauseRes.statusCode === 200, 'PATCH status to PAUSED returned 200 OK');
    assert(pauseData.data?.status === 'PAUSED', 'Campaign status updated to PAUSED');

    // 6. SINGLE CAMPAIGN DETAILS & SUBMISSIONS
    console.log('\n--- 6. Single Campaign Details (GET /api/campaigns/[id]) ---');
    const detailsRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: `/api/campaigns/${createdCampaign.id}`,
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });

    const detailsData = JSON.parse(detailsRes.body);
    assert(detailsRes.statusCode === 200, 'GET /api/campaigns/[id] status 200 OK');
    assert(detailsData.data?.campaign?.title === createdCampaign.title, 'Single campaign details title matches');

    server.kill();

    console.log(`\n==================================================`);
    console.log(`PHASE 5 SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
    console.log(`==================================================`);

    if (passedTests === totalTests) {
      console.log('\n🎉 ALL PHASE 5 ADVERTISER SYSTEM TESTS PASSED 100% PERFECTLY!');
      process.exit(0);
    } else {
      console.error('\n❌ PHASE 5 VERIFICATION FAILED!');
      process.exit(1);
    }
  } catch (err) {
    console.error('Phase 5 verification error:', err);
    server.kill();
    process.exit(1);
  }
}

main();
