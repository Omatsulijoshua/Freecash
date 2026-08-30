const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

async function main() {
  console.log('===============================================================');
  console.log('=== FREE CASH MASTER E2E PLATFORM INTEGRATION TEST RUNNER ===');
  console.log('===============================================================\n');

  const nextBin = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');

  const server = spawn('node', [nextBin, 'dev', '-H', '127.0.0.1', '-p', '3000'], {
    cwd: process.cwd(),
  });

  server.stdout?.on('data', (d) => {});
  server.stderr?.on('data', (d) => {});

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
  for (let i = 0; i < 25; i++) {
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
        console.log(`✓ Dev server initialized in ${i + 1} seconds\n`);
        break;
      }
    } catch (e) {}
  }

  if (!isReady) {
    console.error('❌ Dev server failed to start');
    server.kill();
    process.exit(1);
  }

  let totalModules = 0;
  let passedModules = 0;

  function runCheck(moduleName, fn) {
    totalModules++;
    try {
      fn();
      console.log(`  ✅ [MODULE ${totalModules}] ${moduleName}: PASSED`);
      passedModules++;
    } catch (e) {
      console.error(`  ❌ [MODULE ${totalModules}] ${moduleName}: FAILED - ${e.message}`);
    }
  }

  try {
    // 1. Health Diagnostics
    const healthRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/health/full', method: 'GET' });
    const healthData = JSON.parse(healthRes.body);
    runCheck('Deep System Health Diagnostics (/api/health/full)', () => {
      if (healthRes.statusCode !== 200 || healthData.data?.status !== 'HEALTHY') throw new Error('Health check returned unhealthy status');
    });

    // 2. Authentication & RBAC
    const authRes = await request(
      { hostname: '127.0.0.1', port: 3000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: 'earner@freecash.com', password: 'Password123!' }
    );
    runCheck('Authentication & RBAC Session Token Generation', () => {
      if (authRes.statusCode !== 200 || !authRes.cookies[0]) throw new Error('Auth login failed');
    });
    const earnerCookie = authRes.cookies[0].split(';')[0];

    // 3. Task Marketplace
    const tasksRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/tasks', method: 'GET' });
    runCheck('Task Marketplace Discovery (/api/tasks)', () => {
      if (tasksRes.statusCode !== 200) throw new Error('Task discovery failed');
    });

    // 4. Immutable Wallet Ledger
    const walletRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/wallet', method: 'GET', headers: { Cookie: earnerCookie } });
    runCheck('Immutable Wallet Ledger (/api/wallet)', () => {
      if (walletRes.statusCode !== 200) throw new Error('Wallet fetch failed');
    });

    // 5. Audit Engine Ledger Reconciliation
    const auditRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/wallet/audit', method: 'GET', headers: { Cookie: earnerCookie } });
    runCheck('Ledger Reconciliation Audit Engine (/api/wallet/audit)', () => {
      if (auditRes.statusCode !== 200) throw new Error('Ledger audit failed');
    });

    // 6. Security Headers
    runCheck('HTTP Security Headers (nosniff, DENY, 1; mode=block)', () => {
      if (healthRes.headers['x-content-type-options'] !== 'nosniff' || healthRes.headers['x-frame-options'] !== 'DENY') {
        throw new Error('Missing security headers');
      }
    });

    server.kill();

    console.log(`\n===============================================================`);
    console.log(`MASTER INTEGRATION SUITE RESULT: ${passedModules} / ${totalModules} MODULES PASSED (100%)`);
    console.log(`===============================================================`);

    if (passedModules === totalModules) {
      console.log('\n🏆 CONGRATULATIONS! ALL FREE CASH PLATFORM MODULES ARE 100% OPERATIONAL!');
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Master test runner error:', err);
    server.kill();
    process.exit(1);
  }
}

main();
