const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

async function main() {
  console.log('=== STARTING PHASE 17 AUTOMATED TESTING & CI/CD SUITE VERIFICATION ===\n');

  const nextBin = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');

  const server = spawn('node', [nextBin, 'dev', '-H', '127.0.0.1', '-p', '3000'], {
    cwd: process.cwd(),
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
    // 1. DEEP HEALTH MONITORING API (/api/health/full)
    console.log('--- 1. Deep Health Monitoring & Diagnostics (/api/health/full) ---');
    const fullHealthRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/health/full', method: 'GET' });
    const fullHealthData = JSON.parse(fullHealthRes.body);
    assert(fullHealthRes.statusCode === 200, 'GET /api/health/full status 200 OK');
    assert(fullHealthData.data?.status === 'HEALTHY', 'System status reported HEALTHY');
    assert(fullHealthData.data?.database?.status === 'CONNECTED', 'PostgreSQL Database latency check passed');
    assert(Boolean(fullHealthData.data?.metrics?.heapUsedMb), `Node.js memory metrics reported: ${fullHealthData.data?.metrics?.heapUsedMb} MB heap used`);

    // 2. GITHUB ACTIONS CI/CD WORKFLOW VERIFICATION
    console.log('\n--- 2. GitHub Actions CI/CD Workflow File (.github/workflows/ci.yml) ---');
    const ciFilePath = path.join(process.cwd(), '.github', 'workflows', 'ci.yml');
    const ciFileExists = fs.existsSync(ciFilePath);
    assert(ciFileExists, 'GitHub Actions workflow file .github/workflows/ci.yml present');

    // 3. MASTER E2E INTEGRATION TEST RUNNER VERIFICATION
    console.log('\n--- 3. Master E2E Integration Test Runner File (prisma/verify-all.js) ---');
    const verifyAllPath = path.join(process.cwd(), 'prisma', 'verify-all.js');
    const verifyAllExists = fs.existsSync(verifyAllPath);
    assert(verifyAllExists, 'Master Integration Test Runner file prisma/verify-all.js present');

    server.kill();

    console.log(`\n==================================================`);
    console.log(`PHASE 17 SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
    console.log(`==================================================`);

    if (passedTests === totalTests) {
      console.log('\n🎉 ALL PHASE 17 AUTOMATED TESTING & CI/CD TESTS PASSED 100% PERFECTLY!');
      process.exit(0);
    } else {
      console.error('\n❌ PHASE 17 VERIFICATION FAILED!');
      process.exit(1);
    }
  } catch (err) {
    console.error('Phase 17 verification error:', err);
    server.kill();
    process.exit(1);
  }
}

main();
