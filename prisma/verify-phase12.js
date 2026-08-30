const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

async function main() {
  console.log('=== STARTING PHASE 12 SUPPORT & TICKETING SYSTEM AUTOMATED VERIFICATION ===\n');

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
    // 1. AUTHENTICATE EARNER & CREATE SUPPORT TICKET
    console.log('--- 1. Authenticate Earner & Create Support Ticket (/api/tickets) ---');
    const earnerLogin = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: 'earner@freecash.com', password: 'Password123!' }
    );
    const earnerCookie = earnerLogin.cookies[0].split(';')[0];

    const createRes = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/tickets', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: earnerCookie } },
      {
        subject: 'Delayed Bank Transfer Request #10293',
        category: 'WITHDRAWAL_ISSUE',
        message: 'Hello Support Team, my withdrawal request to GTBank has been pending for over 2 hours. Please assist.',
      }
    );
    const createData = JSON.parse(createRes.body);
    assert(createRes.statusCode === 201, 'POST /api/tickets status 201 Created');
    const ticketId = createData.data?.ticket?.id;
    assert(Boolean(ticketId), `Created support ticket ID: ${ticketId}`);

    // 2. QUERY USER TICKETS LIST
    console.log('\n--- 2. Query User Support Tickets List (/api/tickets) ---');
    const listRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/tickets', method: 'GET', headers: { Cookie: earnerCookie } });
    const listData = JSON.parse(listRes.body);
    assert(listRes.statusCode === 200, 'GET /api/tickets status 200 OK');
    assert(Array.isArray(listData.data) && listData.data.length >= 1, `Returned ${listData.data?.length} user support tickets`);

    // 3. AUTHENTICATE SUPPORT STAFF & QUERY TICKET THREAD
    console.log('\n--- 3. Authenticate Support Staff & Query Ticket Thread (/api/tickets/[id]) ---');
    const staffLogin = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: 'admin@freecash.com', password: 'Password123!' }
    );
    const staffCookie = staffLogin.cookies[0].split(';')[0];

    const threadRes = await request({ hostname: '127.0.0.1', port: 3000, path: `/api/tickets/${ticketId}`, method: 'GET', headers: { Cookie: staffCookie } });
    const threadData = JSON.parse(threadRes.body);
    assert(threadRes.statusCode === 200, 'GET /api/tickets/[id] status 200 OK');
    assert(threadData.data?.messages?.length >= 1, 'Ticket thread contains initial message');

    // 4. POST SUPPORT STAFF REPLY
    console.log('\n--- 4. Post Support Staff Reply Message (/api/tickets/[id]/messages) ---');
    const replyRes = await request(
      { hostname: '127.0.0.1', port: 3000, path: `/api/tickets/${ticketId}/messages`, method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: staffCookie } },
      { message: 'Hello Chidi! We have verified your withdrawal transaction with Paystack and your funds have been successfully processed to GTBank.' }
    );
    const replyData = JSON.parse(replyRes.body);
    assert(replyRes.statusCode === 201, 'POST /api/tickets/[id]/messages status 201 Created');

    // 5. UPDATE TICKET STATUS TO RESOLVED
    console.log('\n--- 5. Update Ticket Status to RESOLVED (/api/tickets/[id]/status) ---');
    const statusRes = await request(
      { hostname: '127.0.0.1', port: 3000, path: `/api/tickets/${ticketId}/status`, method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: staffCookie } },
      { status: 'RESOLVED', assignToMe: true }
    );
    const statusData = JSON.parse(statusRes.body);
    assert(statusRes.statusCode === 200, 'PATCH /api/tickets/[id]/status status 200 OK');
    assert(statusData.data?.status === 'RESOLVED', 'Ticket status updated to RESOLVED in database');

    server.kill();

    console.log(`\n==================================================`);
    console.log(`PHASE 12 SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
    console.log(`==================================================`);

    if (passedTests === totalTests) {
      console.log('\n🎉 ALL PHASE 12 SUPPORT & TICKETING TESTS PASSED 100% PERFECTLY!');
      process.exit(0);
    } else {
      console.error('\n❌ PHASE 12 VERIFICATION FAILED!');
      process.exit(1);
    }
  } catch (err) {
    console.error('Phase 12 verification error:', err);
    server.kill();
    process.exit(1);
  }
}

main();
