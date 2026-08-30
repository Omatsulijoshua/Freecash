const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('=== STARTING PHASE 13 REAL-TIME NOTIFICATIONS AUTOMATED VERIFICATION ===\n');

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
    // 1. AUTHENTICATE EARNER
    console.log('--- 1. Authenticate Earner ---');
    const earnerLogin = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: 'earner@freecash.com', password: 'Password123!' }
    );
    assert(earnerLogin.statusCode === 200, 'Earner login status 200 OK');
    const earnerCookie = earnerLogin.cookies[0].split(';')[0];
    const earnerUser = await prisma.user.findUnique({ where: { email: 'earner@freecash.com' } });

    // 2. DISPATCH NOTIFICATIONS (WITHDRAWAL_PROCESSED & TASK_APPROVED)
    console.log('\n--- 2. Dispatch Real-Time Notifications (/api/notifications/send) ---');
    const send1 = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/notifications/send', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: earnerCookie } },
      {
        targetUserId: earnerUser.id,
        type: 'WITHDRAWAL_PROCESSED',
        title: 'Bank Payout Processed',
        message: 'Your withdrawal request for ₦1,500 has been sent to GTBank.',
      }
    );
    assert(send1.statusCode === 201, 'Dispatched WITHDRAWAL_PROCESSED notification (201 Created)');

    const send2 = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/notifications/send', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: earnerCookie } },
      {
        targetUserId: earnerUser.id,
        type: 'TASK_APPROVED',
        title: 'Task Submission Approved',
        message: 'Your app review submission was approved! ₦600 credited to wallet.',
      }
    );
    assert(send2.statusCode === 201, 'Dispatched TASK_APPROVED notification (201 Created)');

    // 3. FETCH NOTIFICATIONS & VERIFY UNREAD COUNTER
    console.log('\n--- 3. Fetch Notifications & Unread Count (/api/notifications) ---');
    const getRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/notifications', method: 'GET', headers: { Cookie: earnerCookie } });
    const getData = JSON.parse(getRes.body);
    assert(getRes.statusCode === 200, 'GET /api/notifications status 200 OK');
    assert(getData.data?.unreadCount >= 2, `Unread badge counter correctly tracking (${getData.data?.unreadCount} unread)`);

    // 4. MARK ALL NOTIFICATIONS AS READ (/api/notifications/read)
    console.log('\n--- 4. Mark Notifications as Read (/api/notifications/read) ---');
    const readRes = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/notifications/read', method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: earnerCookie } },
      { markAll: true }
    );
    assert(readRes.statusCode === 200, 'PATCH /api/notifications/read status 200 OK');

    const getResAfter = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/notifications', method: 'GET', headers: { Cookie: earnerCookie } });
    const getDataAfter = JSON.parse(getResAfter.body);
    assert(getDataAfter.data?.unreadCount === 0, 'Unread badge counter decremented to 0 after marking read');

    server.kill();

    console.log(`\n==================================================`);
    console.log(`PHASE 13 SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
    console.log(`==================================================`);

    if (passedTests === totalTests) {
      console.log('\n🎉 ALL PHASE 13 REAL-TIME NOTIFICATIONS TESTS PASSED 100% PERFECTLY!');
      process.exit(0);
    } else {
      console.error('\n❌ PHASE 13 VERIFICATION FAILED!');
      process.exit(1);
    }
  } catch (err) {
    console.error('Phase 13 verification error:', err);
    server.kill();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
