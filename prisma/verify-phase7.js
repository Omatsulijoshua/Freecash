const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

async function main() {
  console.log('=== STARTING PHASE 7 IMMUTABLE LEDGER WALLET SYSTEM AUTOMATED VERIFICATION ===\n');

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
    const loginRes = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: 'earner@freecash.com', password: 'Password123!' }
    );
    assert(loginRes.statusCode === 200, `Earner login status 200 OK (got ${loginRes.statusCode})`);
    const sessionCookie = loginRes.cookies[0].split(';')[0];

    // 2. FETCH WALLET STATE
    console.log('\n--- 2. Fetch Wallet State (/api/wallet) ---');
    const walletRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/wallet', method: 'GET', headers: { Cookie: sessionCookie } });
    const walletData = JSON.parse(walletRes.body);
    assert(walletRes.statusCode === 200, 'GET /api/wallet status 200 OK');
    assert(typeof walletData.data?.wallet?.balance === 'number', `Wallet balance available (₦${walletData.data?.wallet?.balance})`);

    // 3. FETCH PAGINATED & FILTERED TRANSACTIONS
    console.log('\n--- 3. Fetch Paginated Transactions (/api/wallet/transactions) ---');
    const txRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/wallet/transactions?page=1&limit=10', method: 'GET', headers: { Cookie: sessionCookie } });
    const txData = JSON.parse(txRes.body);
    assert(txRes.statusCode === 200, 'GET /api/wallet/transactions status 200 OK');
    assert(Array.isArray(txData.data?.transactions), `Returned ${txData.data?.transactions?.length} transaction records`);

    // 4. FETCH WALLET SUMMARY METRICS
    console.log('\n--- 4. Fetch Wallet Financial Summary (/api/wallet/summary) ---');
    const summaryRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/wallet/summary', method: 'GET', headers: { Cookie: sessionCookie } });
    const summaryData = JSON.parse(summaryRes.body);
    assert(summaryRes.statusCode === 200, 'GET /api/wallet/summary status 200 OK');
    assert(typeof summaryData.data?.totalEarned === 'number', `Summary totalEarned metric returned (₦${summaryData.data?.totalEarned})`);

    // 5. EXECUTE DOUBLE-ENTRY LEDGER RECONCILIATION AUDIT ENGINE
    console.log('\n--- 5. Execute Double-Entry Ledger Reconciliation Audit Engine (/api/wallet/audit) ---');
    const auditRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/wallet/audit', method: 'GET', headers: { Cookie: sessionCookie } });
    const auditData = JSON.parse(auditRes.body);
    assert(auditRes.statusCode === 200, 'GET /api/wallet/audit status 200 OK');
    assert(auditData.data?.isReconciled === true, 'Ledger reconciliation audit verified: Cached Balance equals SUM(CREDIT) - SUM(DEBIT)');
    assert(auditData.data?.discrepancy === 0, 'Zero discrepancy between cached balance and computed ledger sum');

    server.kill();

    console.log(`\n==================================================`);
    console.log(`PHASE 7 SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
    console.log(`==================================================`);

    if (passedTests === totalTests) {
      console.log('\n🎉 ALL PHASE 7 IMMUTABLE LEDGER WALLET SYSTEM TESTS PASSED 100% PERFECTLY!');
      process.exit(0);
    } else {
      console.error('\n❌ PHASE 7 VERIFICATION FAILED!');
      process.exit(1);
    }
  } catch (err) {
    console.error('Phase 7 verification error:', err);
    server.kill();
    process.exit(1);
  }
}

main();
