const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('=== STARTING PHASE 10 FRAUD DETECTION ENGINE AUTOMATED VERIFICATION ===\n');

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
    // 1. REGISTER TWO TEST USERS FOR FRAUD EVALUATION
    console.log('--- 1. Register Test Users for Fraud Signals ---');
    const userAEmail = `frauda.${Date.now()}@freecash.com`;
    const userBEmail = `fraudb.${Date.now()}@freecash.com`;

    const regA = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { fullName: 'User A', email: userAEmail, password: 'Password123!', role: 'EARNER' }
    );
    const regB = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { fullName: 'User B', email: userBEmail, password: 'Password123!', role: 'EARNER' }
    );

    const userA = await prisma.user.findUnique({ where: { email: userAEmail } });
    const userB = await prisma.user.findUnique({ where: { email: userBEmail } });

    assert(Boolean(userA && userB), 'Registered two distinct test accounts');

    // Authenticate User B session for API evaluation call
    const loginB = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: userBEmail, password: 'Password123!' }
    );
    const userBCookie = loginB.cookies[0].split(';')[0];

    // 2. SIMULATE DUPLICATE PROOF SUBMISSION & TRIGGER FRAUD EVALUATION ENGINE
    console.log('\n--- 2. Trigger Real-Time Anti-Fraud Engine (Duplicate Proof Detection) ---');
    const campaign = await prisma.campaign.findFirst({ where: { status: 'ACTIVE' } });

    // User A submits proof
    const pA = await prisma.taskParticipation.create({
      data: { campaignId: campaign.id, userId: userA.id, status: 'SUBMITTED' },
    });
    await prisma.taskSubmission.create({
      data: { participationId: pA.id, proofText: 'SHARED_EXACT_DUPLICATE_PROOF_TEXT_VERIFICATION_FLAG', status: 'PENDING' },
    });

    // Evaluate Fraud Signals for User B via POST /api/fraud/evaluate
    const evalRes = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/fraud/evaluate', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: userBCookie } },
      { targetUserId: userB.id, proofText: 'SHARED_EXACT_DUPLICATE_PROOF_TEXT_VERIFICATION_FLAG', ipAddress: '192.168.1.100' }
    );

    const evalData = JSON.parse(evalRes.body);
    assert(evalRes.statusCode === 200, 'POST /api/fraud/evaluate status 200 OK');
    assert(evalData.data?.score >= 50, `Fraud score escalated to High Risk (Score: ${evalData.data?.score})`);
    assert(evalData.data?.isFlagged === true, 'Fraud engine flagged user account (isFlagged = true)');

    const updatedUserB = await prisma.user.findUnique({ where: { id: userB.id } });
    assert(updatedUserB.status === 'FLAGGED', 'User account status automatically updated to FLAGGED in database');

    // 3. AUTHENTICATE ADMIN & FETCH FRAUD LOGS (/api/admin/fraud/logs)
    console.log('\n--- 3. Query Admin Fraud Control Logs (/api/admin/fraud/logs) ---');
    const adminLogin = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: 'admin@freecash.com', password: 'Password123!' }
    );
    const adminCookie = adminLogin.cookies[0].split(';')[0];

    const logsRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/admin/fraud/logs', method: 'GET', headers: { Cookie: adminCookie } });
    const logsData = JSON.parse(logsRes.body);
    assert(logsRes.statusCode === 200, 'GET /api/admin/fraud/logs status 200 OK');
    assert(Array.isArray(logsData.data?.flaggedUsers) && logsData.data.flaggedUsers.length >= 1, `Found ${logsData.data?.flaggedUsers?.length} flagged accounts in Admin Control Panel`);

    // 4. EXECUTE ADMIN RISK OVERRIDE (/api/admin/fraud/override)
    console.log('\n--- 4. Execute Admin Risk Override Action (/api/admin/fraud/override) ---');
    const overrideRes = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/admin/fraud/override', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
      { targetUserId: userB.id, action: 'UNFLAG_ACCOUNT' }
    );

    const overrideData = JSON.parse(overrideRes.body);
    assert(overrideRes.statusCode === 200, 'POST /api/admin/fraud/override status 200 OK');

    const restoredUserB = await prisma.user.findUnique({ where: { id: userB.id } });
    assert(restoredUserB.status === 'ACTIVE', 'User B account restored to ACTIVE after admin override');

    server.kill();

    console.log(`\n==================================================`);
    console.log(`PHASE 10 SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
    console.log(`==================================================`);

    if (passedTests === totalTests) {
      console.log('\n🎉 ALL PHASE 10 FRAUD DETECTION ENGINE TESTS PASSED 100% PERFECTLY!');
      process.exit(0);
    } else {
      console.error('\n❌ PHASE 10 VERIFICATION FAILED!');
      process.exit(1);
    }
  } catch (err) {
    console.error('Phase 10 verification error:', err);
    server.kill();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
