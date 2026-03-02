#!/usr/bin/env node

/**
 * Kairos CRE Workflow Deployment Script
 * 
 * Usage:
 *   node deploy.js staging    # Deploy to Base Sepolia
 *   node deploy.js            # Deploy to Base Mainnet
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkPrerequisites() {
  log('\n🔍 Checking prerequisites...', 'blue');

  // Check TypeScript compilation
  const distPath = path.join(__dirname, 'dist');
  if (!fs.existsSync(distPath)) {
    log('❌ dist/ folder not found. Run: npm run build', 'red');
    process.exit(1);
  }
  log('✅ TypeScript compiled', 'green');

  // Check config file
  const isStaging = process.argv[2] === 'staging';
  const configFile = isStaging ? 'config.staging.json' : 'config.json';
  const configPath = path.join(__dirname, configFile);

  if (!fs.existsSync(configPath)) {
    log(`❌ ${configFile} not found`, 'red');
    process.exit(1);
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    log(`✅ ${configFile} loaded`, 'green');
    log(`   Vault: ${config.vaultAddress}`, 'yellow');
    log(`   Controller: ${config.controllerAddress}`, 'yellow');
  } catch (e) {
    log(`❌ ${configFile} is invalid JSON: ${e.message}`, 'red');
    process.exit(1);
  }

  // Check ANTHROPIC_API_KEY
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    log('⚠️  ANTHROPIC_API_KEY not set in environment', 'yellow');
    log('   Set via: export ANTHROPIC_API_KEY="sk-ant-..."', 'yellow');
  } else {
    log('✅ ANTHROPIC_API_KEY configured', 'green');
  }

  return { isStaging, configFile };
}

function deployWorkflow(isStaging) {
  log('\n🚀 Deployment Instructions', 'blue');
  log('=' .repeat(50), 'blue');

  const environment = isStaging ? 'Base Sepolia (Testnet)' : 'Base Mainnet';
  const configFile = isStaging ? 'config.staging.json' : 'config.json';

  log(`\nTarget: ${environment}`, 'bright');
  log(`Config: ${configFile}`, 'bright');

  log('\n📋 Prerequisites:', 'yellow');
  log('  1. CRE CLI installed: npm install -g @chainlink/cre-cli', 'yellow');
  log('  2. Authenticated: cre auth login', 'yellow');
  log('  3. LINK tokens in wallet', 'yellow');
  log('  4. ANTHROPIC_API_KEY configured: cre secrets set ANTHROPIC_API_KEY "sk-ant-..."', 'yellow');

  log('\n🎯 Deployment Steps:', 'bright');
  log('  1. Install CRE CLI:');
  log('     npm install -g @chainlink/cre-cli', 'yellow');

  log('\n  2. Login to CRE:');
  log('     cre auth login', 'yellow');
  log('     → Browser opens', 'yellow');
  log('     → Sign in with Chainlink account', 'yellow');
  log('     → Approve authentication', 'yellow');

  log('\n  3. Configure secrets:');
  log('     cre secrets set ANTHROPIC_API_KEY "sk-ant-api03-..."', 'yellow');

  log('\n  4. Deploy to DON:');
  if (isStaging) {
    log('     cre deploy:staging', 'yellow');
  } else {
    log('     cre deploy', 'yellow');
  }
  log('     → Uploads workflow to Chainlink DON', 'yellow');
  log('     → Returns workflow ID', 'yellow');

  log('\n  5. Wait for approval (5-30 minutes):');
  log('     cre workflow status <workflow-id>', 'yellow');
  log('     → Watch status change from "Pending Approval" → "Active"', 'yellow');

  log('\n  6. Monitor execution:');
  log('     cre workflow logs <workflow-id> --follow', 'yellow');

  log('\n✅ Once status is "Active":');
  log('  • Workflow is live on Chainlink DON', 'green');
  log('  • Ready to process StrategyRequested events', 'green');
  log('  • Test from frontend: http://localhost:3000', 'green');

  log('\n📊 Expected Logs:', 'blue');
  log('  [Kairos] StrategyRequested event detected', 'yellow');
  log('  [Kairos] ✅ Successfully read 3/3 on-chain protocols', 'yellow');
  log('  [Claude] ✅ Claude response received', 'yellow');
  log('  [Kairos] ✅ Report delivered successfully', 'yellow');

  log('\n🆘 Troubleshooting:', 'blue');
  log('  cre: command not found       → npm install -g @chainlink/cre-cli', 'yellow');
  log('  Unauthorized                 → cre auth logout && cre auth login', 'yellow');
  log('  Secret not found             → cre secrets set ANTHROPIC_API_KEY "..."', 'yellow');
  log('  Pending Approval stuck       → Wait 5-30 min, check: cre workflow logs <id>', 'yellow');

  log('\n' + '=' .repeat(50), 'blue');
}

function main() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'bright');
  log('║     Kairos Finance - CRE Workflow Deployment Guide        ║', 'bright');
  log('╚════════════════════════════════════════════════════════════╝', 'bright');

  const { isStaging, configFile } = checkPrerequisites();
  deployWorkflow(isStaging);

  const configPath = path.join(__dirname, configFile);
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  log('\n📦 Workflow Configuration:', 'blue');
  log(`  Environment: ${isStaging ? 'Staging' : 'Production'}`, 'yellow');
  log(`  Config File: ${configFile}`, 'yellow');
  log(`  Vault Address: ${config.vaultAddress}`, 'yellow');
  log(`  Controller Address: ${config.controllerAddress}`, 'yellow');
  log(`  Schedule: ${config.schedule}`, 'yellow');

  log('\n💡 Next Command to Run:', 'bright');
  log('   npm install -g @chainlink/cre-cli && cre auth login', 'green');
  log('\n');
}

main();
