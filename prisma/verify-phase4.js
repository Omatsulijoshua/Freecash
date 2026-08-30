const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

async function main() {
  console.log('=== STARTING PHASE 4 USER EXPERIENCE AUTOMATED VERIFICATION ===\n');

  const nextBin = path.join('c:', 'Users', 'Joshua', 'Desktop', 'freecash', 'node_modules', 'next', 'dist', 'bin', 'next');

  // Spawn local dev server
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

  // Poll server readiness
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
    // 1. LOGIN SEEDED EARNER USER
    console.log('--- 1. Authenticate Seeded Earner ---');
    const loginRes = await request(
      {
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        email: 'earner@freecash.com',
        password: 'Password123!',
      }
    );

    assert(loginRes.statusCode === 200, `Login status 200 OK (got ${loginRes.statusCode})`);
    const sessionCookie = loginRes.cookies ? loginRes.cookies[0].split(';')[0] : '';
    assert(sessionCookie.startsWith('freecash_session='), 'Session cookie obtained');

    // 2. FETCH MARKETPLACE TASKS
    console.log('\n--- 2. Task Discovery Marketplace API (/api/tasks) ---');
    const tasksRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/tasks',
      method: 'GET',
    });

    const tasksData = JSON.parse(tasksRes.body);
    assert(tasksRes.statusCode === 200, 'GET /api/tasks status code 200 OK');
    assert(Array.isArray(tasksData.data) && tasksData.data.length >= 2, `Marketplace returned active tasks (Found ${tasksData.data?.length})`);

    const targetTask = tasksData.data[0];
    assert(Boolean(targetTask.id && targetTask.reward > 0), `Task card contains ID and reward amount (₦${targetTask.reward})`);

    // 3. FETCH TASK DETAILS
    console.log('\n--- 3. Task Details API (/api/tasks/[id]) ---');
    const taskDetailsRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: `/api/tasks/${targetTask.id}`,
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });

    const detailsData = JSON.parse(taskDetailsRes.body);
    assert(taskDetailsRes.statusCode === 200, 'GET /api/tasks/[id] status code 200 OK');
    assert(detailsData.data.task.title === targetTask.title, 'Task details title matches marketplace card');

    // 4. START TASK PARTICIPATION
    console.log('\n--- 4. Start Task Session (/api/tasks/[id]/start) ---');
    const startRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: `/api/tasks/${targetTask.id}/start`,
      method: 'POST',
      headers: { Cookie: sessionCookie },
    });

    const startData = JSON.parse(startRes.body);
    assert(startRes.statusCode === 200 || startRes.statusCode === 201, `Start task status 200/201 (got ${startRes.statusCode})`);
    assert(startData.data?.id, 'Created TaskParticipation record');

    // 5. SUBMIT TASK EVIDENCE PROOF
    console.log('\n--- 5. Submit Task Evidence Proof (/api/tasks/[id]/submit) ---');
    const submitRes = await request(
      {
        hostname: '127.0.0.1',
        port: 3000,
        path: `/api/tasks/${targetTask.id}/submit`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie,
        },
      },
      {
        proofText: 'Installed Kuda App. Account email: earner@freecash.com',
        evidenceUrls: ['https://storage.freecash.com/evidence/test_proof_screenshot.jpg'],
      }
    );

    const submitData = JSON.parse(submitRes.body);
    assert(submitRes.statusCode === 200, `Submit proof status code 200 OK (got ${submitRes.statusCode})`);
    assert(submitData.data?.submission?.status === 'PENDING', 'Submission status marked as PENDING review');

    // 6. TASK HISTORY LOOKUP
    console.log('\n--- 6. User Task History (/api/tasks/history) ---');
    const historyRes = await request({
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/tasks/history',
      method: 'GET',
      headers: { Cookie: sessionCookie },
    });

    const historyData = JSON.parse(historyRes.body);
    assert(historyRes.statusCode === 200, 'GET /api/tasks/history status code 200 OK');
    assert(Array.isArray(historyData.data) && historyData.data.length >= 1, `Found ${historyData.data?.length} task history entries`);

    server.kill();

    console.log(`\n==================================================`);
    console.log(`PHASE 4 SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
    console.log(`==================================================`);

    if (passedTests === totalTests) {
      console.log('\n🎉 ALL PHASE 4 USER EXPERIENCE TESTS PASSED 100% PERFECTLY!');
      process.exit(0);
    } else {
      console.error('\n❌ PHASE 4 VERIFICATION FAILED!');
      process.exit(1);
    }
  } catch (err) {
    console.error('Phase 4 verification error:', err);
    server.kill();
    process.exit(1);
  }
}

main();
