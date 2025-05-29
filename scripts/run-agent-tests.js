#!/usr/bin/env node

/**
 * Test runner for AI Agent Support (v5) implementation
 * Runs tests by phase to validate the complete implementation
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const testPhases = [
  {
    phase: 'Phase 1: Foundation',
    file: 'phase-1-foundation.test.ts',
    description: 'TypeScript interfaces, validation schemas, error handling utilities'
  },
  {
    phase: 'Phase 2: Backend Core', 
    file: 'phase-2-backend-core.test.ts',
    description: 'Database schema, services, middleware, providers'
  },
  {
    phase: 'Phase 3: API Integration',
    file: 'phase-3-api-integration.test.ts', 
    description: 'OpenAI function calling integration, API routes'
  },
  {
    phase: 'Phase 4: Frontend',
    file: 'phase-4-frontend.test.tsx',
    description: 'React components, hooks, UI integration'
  },
  {
    phase: 'End-to-End Integration',
    file: 'agent-integration-e2e.test.tsx',
    description: 'Complete workflow testing with real tenant and user IDs'
  }
];

async function runPhaseTests() {
  console.log('🤖 Running AI Agent Support (v5) Tests by Phase\n');
  console.log('Using real tenant ID and user ID from env.local');
  console.log('Tenant ID: 22222222-2222-2222-2222-222222222222');
  console.log('User ID: 20000000-0000-0000-0000-000000000001\n');

  let totalPassed = 0;
  let totalFailed = 0;
  const results = [];

  for (const phase of testPhases) {
    console.log(`\n📋 ${phase.phase}`);
    console.log(`📝 ${phase.description}`);
    console.log(`🧪 Running: ${phase.file}`);
    console.log(''.padEnd(60, '-'));

    const testFile = path.join(__dirname, '..', 'src', 'unit-tests', phase.file);
    
    // Check if test file exists
    if (!fs.existsSync(testFile)) {
      console.log(`❌ Test file not found: ${phase.file}`);
      results.push({ phase: phase.phase, status: 'missing', file: phase.file });
      continue;
    }

    try {
      // Run the specific test file
      const output = execSync(`npm test -- ${phase.file}`, {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8',
        stdio: 'pipe'
      });

      // Parse Jest output for pass/fail counts
      const passMatch = output.match(/(\d+) passing/);
      const failMatch = output.match(/(\d+) failing/);
      
      const passed = passMatch ? parseInt(passMatch[1]) : 0;
      const failed = failMatch ? parseInt(failMatch[1]) : 0;

      totalPassed += passed;
      totalFailed += failed;

      if (failed === 0) {
        console.log(`✅ Phase completed successfully`);
        console.log(`✅ ${passed} tests passed`);
        results.push({ phase: phase.phase, status: 'passed', passed, failed, file: phase.file });
      } else {
        console.log(`❌ Phase had failures`);
        console.log(`✅ ${passed} tests passed, ❌ ${failed} tests failed`);
        results.push({ phase: phase.phase, status: 'failed', passed, failed, file: phase.file });
      }

    } catch (error) {
      console.log(`❌ Phase failed to run`);
      console.log(`Error: ${error.message}`);
      results.push({ phase: phase.phase, status: 'error', error: error.message, file: phase.file });
      totalFailed++;
    }
  }

  // Summary
  console.log('\n'.padEnd(80, '='));
  console.log('🎯 AI AGENT SUPPORT (v5) TEST SUMMARY');
  console.log(''.padEnd(80, '='));

  results.forEach(result => {
    const statusEmoji = result.status === 'passed' ? '✅' : 
                       result.status === 'failed' ? '❌' : 
                       result.status === 'missing' ? '⚠️' : '💥';
    
    console.log(`${statusEmoji} ${result.phase}`);
    
    if (result.status === 'passed' || result.status === 'failed') {
      console.log(`   📊 ${result.passed || 0} passed, ${result.failed || 0} failed`);
    } else if (result.status === 'error') {
      console.log(`   💥 ${result.error}`);
    } else if (result.status === 'missing') {
      console.log(`   ⚠️  Test file not found: ${result.file}`);
    }
  });

  console.log('\n📊 OVERALL RESULTS:');
  console.log(`✅ Total tests passed: ${totalPassed}`);
  console.log(`❌ Total tests failed: ${totalFailed}`);
  console.log(`🎯 Success rate: ${totalPassed + totalFailed > 0 ? Math.round((totalPassed / (totalPassed + totalFailed)) * 100) : 0}%`);

  const allPassed = results.every(r => r.status === 'passed');
  
  if (allPassed) {
    console.log('\n🎉 ALL PHASES COMPLETED SUCCESSFULLY!');
    console.log('🚀 AI Agent Support (v5) implementation is ready for production');
  } else {
    console.log('\n⚠️  Some phases had issues. Review the results above.');
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});

// Run the tests
runPhaseTests().catch(console.error);