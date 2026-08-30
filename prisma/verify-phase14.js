const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

async function main() {
  console.log('=== STARTING PHASE 14 ADVANCED ANALYTICS & REPORTING ENGINE AUTOMATED VERIFICATION ===\n');

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
    // 1. EARNER ANALYTICS
    console.log('--- 1. Authenticate Earner & Query Analytics (/api/user/analytics) ---');
    const earnerLogin = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: 'earner@freecash.com', password: 'Password123!' }
    );
    const earnerCookie = earnerLogin.cookies[0].split(';')[0];

    const analyticsRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/user/analytics', method: 'GET', headers: { Cookie: earnerCookie } });
    const analyticsData = JSON.parse(analyticsRes.body);
    assert(analyticsRes.statusCode === 200, 'GET /api/user/analytics status 200 OK');
    assert(typeof analyticsData.data?.completionRate === 'number', `Completion success rate: ${analyticsData.data?.completionRate}%`);

    // 2. TRANSACTION LEDGER CSV EXPORT
    console.log('\n--- 2. Export Transaction Ledger CSV (/api/reports/transactions/export) ---');
    const txCsvRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/reports/transactions/export', method: 'GET', headers: { Cookie: earnerCookie } });
    assert(txCsvRes.statusCode === 200, 'GET /api/reports/transactions/export status 200 OK');
    assert(txCsvRes.headers['content-type']?.includes('text/csv'), 'Returned Content-Type text/csv');
    assert(txCsvRes.body.startsWith('Transaction Ref,Type,Direction'), 'CSV content contains expected transaction headers');

    // 3. CAMPAIGN PERFORMANCE REPORT CSV EXPORT
    console.log('\n--- 3. Export Campaign Performance CSV (/api/reports/campaigns/export) ---');
    const advLogin = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: 'advertiser@freecash.com', password: 'Password123!' }
    );
    const advCookie = advLogin.cookies[0].split(';')[0];

    const campCsvRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/reports/campaigns/export', method: 'GET', headers: { Cookie: advCookie } });
    assert(campCsvRes.statusCode === 200, 'GET /api/reports/campaigns/export status 200 OK');
    assert(campCsvRes.body.startsWith('Campaign Title,Category'), 'CSV content contains expected campaign headers');

    // 4. AUDIT LOG REPORT CSV EXPORT
    console.log('\n--- 4. Export Audit Trail CSV (/api/reports/audit/export) ---');
    const adminLogin = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: 'admin@freecash.com', password: 'Password123!' }
    );
    const adminCookie = adminLogin.cookies[0].split(';')[0];

    const auditCsvRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/reports/audit/export', method: 'GET', headers: { Cookie: adminCookie } });
    assert(auditCsvRes.statusCode === 200, 'GET /api/reports/audit/export status 200 OK');
    assert(auditCsvRes.body.startsWith('Log ID,Admin Email'), 'CSV content contains expected audit log headers');

    server.kill();

    console.log(`\n==================================================`);
    console.log(`PHASE 14 SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
    console.log(`==================================================`);

    if (passedTests === totalTests) {
      console.log('\n🎉 ALL PHASE 14 ADVANCED ANALYTICS & REPORTING TESTS PASSED 100% PERFECTLY!');
      process.exit(0);
    } else {
      console.error('\n❌ PHASE 14 VERIFICATION FAILED!');
      process.exit(1);
    }
  } catch (err) {
    console.error('Phase 14 verification error:', err);
    server.kill();
    process.exit(1);
  }
}

main();
