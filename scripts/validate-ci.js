#!/usr/bin/env node

/**
 * 🔍 Local CI/CD Validator
 * Simula el pipeline de CI/CD localmente antes de hacer push
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

const log = {
  info: (msg) => console.log(chalk.blue('ℹ'), msg),
  success: (msg) => console.log(chalk.green('✓'), msg),
  error: (msg) => console.log(chalk.red('✗'), msg),
  warn: (msg) => console.log(chalk.yellow('⚠'), msg),
  step: (msg) => console.log(chalk.cyan('\n→'), chalk.bold(msg))
};

async function runCommand(cmd, cwd = '.') {
  try {
    const { stdout, stderr } = await execAsync(cmd, { cwd });
    if (stderr && !stderr.includes('warn')) {
      log.warn(stderr);
    }
    return { success: true, output: stdout };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function validatePipeline() {
  console.log(chalk.bold.cyan('\n🚀 CI/CD Pipeline Validator\n'));
  console.log('Simulating GitHub Actions pipeline locally...\n');

  let totalSteps = 0;
  let passedSteps = 0;

  // ====================================
  // STEP 1: LINT BACKEND
  // ====================================
  totalSteps++;
  log.step('Step 1/7: Linting Backend');
  const lintBackend = await runCommand('npm run lint', './backend');
  
  if (lintBackend.success) {
    log.success('Backend linting passed');
    passedSteps++;
  } else {
    log.error('Backend linting failed');
    console.log(lintBackend.error);
  }

  // ====================================
  // STEP 2: LINT FRONTEND
  // ====================================
  totalSteps++;
  log.step('Step 2/7: Linting Frontend');
  const lintFrontend = await runCommand('npm run lint', './frontend');
  
  if (lintFrontend.success) {
    log.success('Frontend linting passed');
    passedSteps++;
  } else {
    log.error('Frontend linting failed');
    console.log(lintFrontend.error);
  }

  // ====================================
  // STEP 3: UNIT TESTS
  // ====================================
  totalSteps++;
  log.step('Step 3/7: Running Unit Tests');
  const tests = await runCommand('npm run test:unit', './backend');
  
  if (tests.success) {
    log.success('Unit tests passed');
    passedSteps++;
  } else {
    log.error('Unit tests failed');
    console.log(tests.error);
  }

  // ====================================
  // STEP 4: BUILD BACKEND
  // ====================================
  totalSteps++;
  log.step('Step 4/7: Validating Backend Structure');
  const backendValidation = await runCommand('test -f src/index.js && test -f package.json && echo "OK"', './backend');
  
  if (backendValidation.success && backendValidation.output.includes('OK')) {
    log.success('Backend structure validated');
    passedSteps++;
  } else {
    log.error('Backend structure invalid');
  }

  // ====================================
  // STEP 5: BUILD FRONTEND
  // ====================================
  totalSteps++;
  log.step('Step 5/7: Building Frontend');
  const buildFrontend = await runCommand('npm run build', './frontend');
  
  if (buildFrontend.success) {
    log.success('Frontend build successful');
    passedSteps++;
  } else {
    log.error('Frontend build failed');
    console.log(buildFrontend.error);
  }

  // ====================================
  // STEP 6: SECURITY AUDIT BACKEND
  // ====================================
  totalSteps++;
  log.step('Step 6/7: Security Audit Backend');
  const auditBackend = await runCommand('npm audit --audit-level=high', './backend');
  
  if (auditBackend.success) {
    log.success('Backend security audit passed');
    passedSteps++;
  } else {
    log.warn('Backend has security vulnerabilities (non-blocking)');
    passedSteps++; // Continue-on-error
  }

  // ====================================
  // STEP 7: SECURITY AUDIT FRONTEND
  // ====================================
  totalSteps++;
  log.step('Step 7/7: Security Audit Frontend');
  const auditFrontend = await runCommand('npm audit --audit-level=high', './frontend');
  
  if (auditFrontend.success) {
    log.success('Frontend security audit passed');
    passedSteps++;
  } else {
    log.warn('Frontend has security vulnerabilities (non-blocking)');
    passedSteps++; // Continue-on-error
  }

  // ====================================
  // SUMMARY
  // ====================================
  console.log(chalk.bold('\n' + '─'.repeat(50)));
  console.log(chalk.bold('📊 Pipeline Summary\n'));
  
  const percentage = Math.round((passedSteps / totalSteps) * 100);
  const color = percentage === 100 ? chalk.green : percentage >= 70 ? chalk.yellow : chalk.red;
  
  console.log(`Steps Passed: ${color(passedSteps)}/${totalSteps}`);
  console.log(`Success Rate: ${color(percentage + '%')}`);
  
  if (percentage === 100) {
    console.log(chalk.green.bold('\n✅ All checks passed! Ready to push.\n'));
    process.exit(0);
  } else if (percentage >= 70) {
    console.log(chalk.yellow.bold('\n⚠️  Some checks failed. Review before pushing.\n'));
    process.exit(1);
  } else {
    console.log(chalk.red.bold('\n❌ Pipeline failed. Fix errors before pushing.\n'));
    process.exit(1);
  }
}

// Run validator
validatePipeline().catch(error => {
  log.error('Validator crashed:');
  console.error(error);
  process.exit(1);
});
