const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function main() {
  console.log('=== STARTING PHASE 18 PRODUCTION READINESS AUTOMATED VERIFICATION ===\n');

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
    // 1. .ENV.EXAMPLE SPECIFICATION VERIFICATION
    console.log('--- 1. Verify Production Environment Specification (.env.example) ---');
    const envExamplePath = path.join('c:', 'Users', 'Joshua', 'Desktop', 'freecash', '.env.example');
    assert(fs.existsSync(envExamplePath), '.env.example template file present');
    const envContent = fs.readFileSync(envExamplePath, 'utf8');
    assert(envContent.includes('DATABASE_URL'), '.env.example specifies DATABASE_URL');
    assert(envContent.includes('JWT_SECRET'), '.env.example specifies JWT_SECRET');
    assert(envContent.includes('PAYSTACK_SECRET_KEY'), '.env.example specifies PAYSTACK_SECRET_KEY');

    // 2. ENVIRONMENT VALIDATOR MODULE VERIFICATION
    console.log('\n--- 2. Verify Environment Validator Module (src/lib/env-validator.ts) ---');
    const validatorPath = path.join('c:', 'Users', 'Joshua', 'Desktop', 'freecash', 'src', 'lib', 'env-validator.ts');
    assert(fs.existsSync(validatorPath), 'src/lib/env-validator.ts file present');

    // 3. MASTER PLATFORM E2E INTEGRATION VERIFICATION SWEEP
    console.log('\n--- 3. Execute Master Platform E2E Integration Verification Sweep ---');
    const masterProc = spawn('node', ['prisma/verify-all.js'], { cwd: 'c:\\Users\\Joshua\\Desktop\\freecash' });

    let masterOutput = '';
    masterProc.stdout?.on('data', (d) => {
      const str = d.toString();
      masterOutput += str;
      console.log(str.trim());
    });
    masterProc.stderr?.on('data', (d) => console.error(d.toString().trim()));

    masterProc.on('close', (code) => {
      assert(code === 0, 'Master E2E Platform Integration Runner passed 100%');

      console.log(`\n==================================================`);
      console.log(`PHASE 18 SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
      console.log(`==================================================`);

      if (passedTests === totalTests) {
        console.log('\n🎉 ALL PHASE 18 PRODUCTION READINESS TESTS PASSED 100% PERFECTLY!');
        process.exit(0);
      } else {
        console.error('\n❌ PHASE 18 VERIFICATION FAILED!');
        process.exit(1);
      }
    });
  } catch (err) {
    console.error('Phase 18 verification error:', err);
    process.exit(1);
  }
}

main();
