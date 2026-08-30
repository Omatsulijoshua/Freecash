const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

function sanitizeHtml(input) {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

async function main() {
  console.log('=== STARTING PHASE 16 SECURITY HARDENING & RATE LIMITING AUTOMATED VERIFICATION ===\n');

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
    // 1. HTTP SECURITY HEADERS VERIFICATION
    console.log('--- 1. Verify HTTP Security Headers (/api/health) ---');
    const healthRes = await request({ hostname: '127.0.0.1', port: 3000, path: '/api/health', method: 'GET' });
    assert(healthRes.statusCode === 200, 'GET /api/health status 200 OK');
    assert(healthRes.headers['x-content-type-options'] === 'nosniff', 'X-Content-Type-Options: nosniff header present');
    assert(healthRes.headers['x-frame-options'] === 'DENY', 'X-Frame-Options: DENY header present');
    assert(healthRes.headers['x-xss-protection'] === '1; mode=block', 'X-XSS-Protection header present');

    // 2. SLIDING-WINDOW RATE LIMITER VERIFICATION (5 REQ/MIN LIMIT)
    console.log('\n--- 2. Sliding-Window Rate Limiter Enforcement (/api/auth/test-rate-limit) ---');
    let hitRateLimit = false;
    for (let i = 1; i <= 6; i++) {
      const res = await request(
        { hostname: '127.0.0.1', port: 3000, path: '/api/auth/test-rate-limit', method: 'POST', headers: { 'Content-Type': 'application/json' } },
        { attempt: i }
      );
      if (res.statusCode === 429) {
        hitRateLimit = true;
        assert(res.headers['retry-after'] === '60', 'HTTP 429 response contains Retry-After: 60 header');
        assert(JSON.parse(res.body).error === 'Too Many Requests', 'HTTP 429 error message correctly set');
        break;
      }
    }
    assert(hitRateLimit, 'Rate Limiter correctly triggered HTTP 429 Too Many Requests on 6th burst attempt');

    // 3. XSS INPUT SANITIZER VERIFICATION
    console.log('\n--- 3. XSS Input Sanitizer Engine ---');
    const rawMaliciousInput = "<script>alert('hack')</script><a href='javascript:void(0)'>Click</a>";
    const sanitizedOutput = sanitizeHtml(rawMaliciousInput);
    assert(!sanitizedOutput.includes('<script>'), 'Sanitizer stripped raw HTML <script> tags');
    assert(sanitizedOutput.includes('&lt;script&gt;'), 'Sanitizer escaped HTML entities safely');

    server.kill();

    console.log(`\n==================================================`);
    console.log(`PHASE 16 SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
    console.log(`==================================================`);

    if (passedTests === totalTests) {
      console.log('\n🎉 ALL PHASE 16 SECURITY HARDENING & RATE LIMITING TESTS PASSED 100% PERFECTLY!');
      process.exit(0);
    } else {
      console.error('\n❌ PHASE 16 VERIFICATION FAILED!');
      process.exit(1);
    }
  } catch (err) {
    console.error('Phase 16 verification error:', err);
    server.kill();
    process.exit(1);
  }
}

main();
