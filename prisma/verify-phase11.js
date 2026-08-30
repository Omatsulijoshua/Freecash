const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('=== STARTING PHASE 11 ADMIN CONTROL PANEL AUTOMATED VERIFICATION ===\n');

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
    // 1. AUTHENTICATE ADMIN (admin@freecash.com)
    console.log('--- 1. Authenticate Admin ---');
    const adminLogin = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: 'admin@freecash.com', password: 'Password123!' }
    );
    assert(adminLogin.statusCode === 200, 'Admin login status 200 OK');
    const adminCookie = adminLogin.cookies[0].split(';')[0];

    // 2. QUERY EXECUTIVE PLATFORM KPIS (/api/admin/analytics)
    console.log('\n--- 2. Query Executive Platform KPIs (/api/admin/analytics) ---');
    const kpisRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/admin/analytics', method: 'GET', headers: { Cookie: adminCookie } });
    const kpisData = JSON.parse(kpisRes.body);
    assert(kpisRes.statusCode === 200, 'GET /api/admin/analytics status 200 OK');
    assert(typeof kpisData.data?.totalUsers === 'number', `Total registered platform users: ${kpisData.data?.totalUsers}`);
    assert(typeof kpisData.data?.totalGmv === 'number', `Total platform GMV returned: ₦${kpisData.data?.totalGmv}`);

    // 3. QUERY USER DIRECTORY & EXECUTE MANUAL WALLET ADJUSTMENT (/api/admin/users/[id])
    console.log('\n--- 3. User Directory Search & Wallet Adjustment (/api/admin/users) ---');
    const usersRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/admin/users?role=EARNER', method: 'GET', headers: { Cookie: adminCookie } });
    const usersData = JSON.parse(usersRes.body);
    assert(usersRes.statusCode === 200, 'GET /api/admin/users status 200 OK');
    const targetUser = usersData.data?.[0];
    assert(Boolean(targetUser), `Found target earner user: ${targetUser?.email}`);

    const adjustRes = await request(
      { hostname: '127.0.0.1', port: 3000, path: `/api/admin/users/${targetUser.id}`, method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
      { balanceAdjustment: 500, reason: 'Admin manual reward bonus test adjustment' }
    );
    const adjustData = JSON.parse(adjustRes.body);
    assert(adjustRes.statusCode === 200, 'PATCH /api/admin/users/[id] status 200 OK');
    assert(Boolean(adjustData.data?.auditLog), 'Created immutable AuditLog entry for wallet adjustment');

    // 4. DYNAMIC SYSTEM SETTINGS MANAGER (/api/admin/settings)
    console.log('\n--- 4. Update Dynamic System Setting (/api/admin/settings) ---');
    const setRes = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/admin/settings', method: 'PATCH', headers: { 'Content-Type': 'application/json', Cookie: adminCookie } },
      { key: 'platform_commission_percentage', value: '25', description: 'Platform commission percentage' }
    );
    const setData = JSON.parse(setRes.body);
    assert(setRes.statusCode === 200, 'PATCH /api/admin/settings status 200 OK');
    assert(setData.data?.value === '25', 'Live updated platform_commission_percentage to 25%');

    // 5. QUERY IMMUTABLE AUDIT LOGS (/api/admin/audit-logs)
    console.log('\n--- 5. Query Immutable Audit Trail (/api/admin/audit-logs) ---');
    const auditRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/admin/audit-logs', method: 'GET', headers: { Cookie: adminCookie } });
    const auditData = JSON.parse(auditRes.body);
    assert(auditRes.statusCode === 200, 'GET /api/admin/audit-logs status 200 OK');
    assert(Array.isArray(auditData.data) && auditData.data.length >= 2, `Audit trail recorded ${auditData.data?.length} admin actions`);

    server.kill();

    console.log(`\n==================================================`);
    console.log(`PHASE 11 SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
    console.log(`==================================================`);

    if (passedTests === totalTests) {
      console.log('\n🎉 ALL PHASE 11 ADMIN CONTROL PANEL TESTS PASSED 100% PERFECTLY!');
      process.exit(0);
    } else {
      console.error('\n❌ PHASE 11 VERIFICATION FAILED!');
      process.exit(1);
    }
  } catch (err) {
    console.error('Phase 11 verification error:', err);
    server.kill();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
