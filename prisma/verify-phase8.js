const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

async function main() {
  console.log('=== STARTING PHASE 8 PAYMENTS & WITHDRAWALS AUTOMATED VERIFICATION ===\n');

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
    // 1. BANK LIST API
    console.log('--- 1. Fetch Supported Nigerian Commercial Banks (/api/payments/banks) ---');
    const banksRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/payments/banks', method: 'GET' });
    const banksData = JSON.parse(banksRes.body);
    assert(banksRes.statusCode === 200, 'GET /api/payments/banks status 200 OK');
    assert(Array.isArray(banksData.data) && banksData.data.length >= 10, `Returned ${banksData.data?.length} Nigerian banks`);

    // 2. AUTHENTICATE EARNER & BANK ACCOUNT RESOLUTION
    console.log('\n--- 2. Authenticate Earner & Resolve Bank Account (/api/payments/bank/resolve) ---');
    const earnerLogin = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: 'earner@freecash.com', password: 'Password123!' }
    );
    const earnerCookie = earnerLogin.cookies[0].split(';')[0];

    const resolveRes = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/payments/bank/resolve', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: earnerCookie } },
      { bankCode: '058', accountNumber: '0123456789' }
    );
    const resolveData = JSON.parse(resolveRes.body);
    assert(resolveRes.statusCode === 200, 'POST /api/payments/bank/resolve status 200 OK');
    assert(Boolean(resolveData.data?.accountName), `Resolved account holder name: ${resolveData.data?.accountName}`);

    // 3. ADVERTISER DEPOSIT INITIALIZATION & VERIFICATION
    console.log('\n--- 3. Advertiser Deposit Funding (/api/payments/deposit/initialize & verify) ---');
    const advLogin = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: 'advertiser@freecash.com', password: 'Password123!' }
    );
    const advCookie = advLogin.cookies[0].split(';')[0];

    const depInitRes = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/payments/deposit/initialize', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: advCookie } },
      { amount: 50000, provider: 'PAYSTACK' }
    );
    const depInitData = JSON.parse(depInitRes.body);
    assert(depInitRes.statusCode === 201, 'POST /api/payments/deposit/initialize status 201 Created');
    const depRef = depInitData.data?.reference;

    const depVerifyRes = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/payments/deposit/verify', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: advCookie } },
      { reference: depRef }
    );
    const depVerifyData = JSON.parse(depVerifyRes.body);
    assert(depVerifyRes.statusCode === 200, 'POST /api/payments/deposit/verify status 200 OK');
    assert(depVerifyData.data?.updatedDeposit?.status === 'COMPLETED', 'Deposit status updated to COMPLETED');
    assert(depVerifyData.data?.ledgerTx?.type === 'DEPOSIT', 'Created DEPOSIT transaction ledger entry');

    // 4. MINIMUM WITHDRAWAL THRESHOLD ENFORCEMENT
    console.log('\n--- 4. Minimum Withdrawal Threshold Enforcement ---');
    const failWithdrawRes = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/payments/withdraw', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: earnerCookie } },
      { amount: 500, bankCode: '058', bankName: 'GTBank', accountNumber: '0123456789', accountName: 'Chidi Okafor' }
    );
    assert(failWithdrawRes.statusCode === 400 || failWithdrawRes.statusCode === 422, 'Rejected withdrawal under ₦1,000 minimum threshold');

    // 5. EARNER WITHDRAWAL REQUEST & LEDGER DEBIT
    console.log('\n--- 5. Earner Withdrawal Request & Ledger Debit (/api/payments/withdraw) ---');
    const meResBefore = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/auth/me', method: 'GET', headers: { Cookie: earnerCookie } });
    const initialEarnerBal = Number(JSON.parse(meResBefore.body).data.user.wallet?.balance || 0);

    const withdrawRes = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/payments/withdraw', method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: earnerCookie } },
      { amount: 1500, bankCode: '058', bankName: 'GTBank', accountNumber: '0123456789', accountName: 'Chidi Okafor' }
    );

    const withdrawData = JSON.parse(withdrawRes.body);
    assert(withdrawRes.statusCode === 200, 'POST /api/payments/withdraw status 200 OK');
    assert(withdrawData.data?.withdrawal?.status === 'REQUESTED', 'Withdrawal request created with status REQUESTED');
    assert(withdrawData.data?.ledgerTx?.direction === 'DEBIT', 'Created WITHDRAWAL DEBIT ledger entry');

    const meResAfter = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/auth/me', method: 'GET', headers: { Cookie: earnerCookie } });
    const finalEarnerBal = Number(JSON.parse(meResAfter.body).data.user.wallet?.balance || 0);
    assert(finalEarnerBal === initialEarnerBal - 1500, `Earner wallet debited: ₦${initialEarnerBal} -> ₦${finalEarnerBal} (-₦1,500)`);

    server.kill();

    console.log(`\n==================================================`);
    console.log(`PHASE 8 SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
    console.log(`==================================================`);

    if (passedTests === totalTests) {
      console.log('\n🎉 ALL PHASE 8 PAYMENTS & WITHDRAWALS TESTS PASSED 100% PERFECTLY!');
      process.exit(0);
    } else {
      console.error('\n❌ PHASE 8 VERIFICATION FAILED!');
      process.exit(1);
    }
  } catch (err) {
    console.error('Phase 8 verification error:', err);
    server.kill();
    process.exit(1);
  }
}

main();
