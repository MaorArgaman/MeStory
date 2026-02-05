/**
 * Environment Configuration Check Script
 * Verifies all critical environment variables are properly configured
 * Run this before starting the application: node check-env.js
 */

const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Required environment variables with descriptions
const requiredVars = {
  // Database
  MONGODB_URI: {
    description: 'MongoDB connection string',
    example: 'mongodb://localhost:27017/MeStory',
    critical: true,
  },

  // Authentication
  JWT_SECRET: {
    description: 'Secret key for JWT token generation',
    example: 'your-super-secret-jwt-key-change-in-production',
    critical: true,
  },

  // Google Gemini AI
  GEMINI_API_KEY: {
    description: 'Google Gemini API key for AI features',
    example: 'AIzaSy...',
    critical: true,
    note: 'Get your key from: https://makersuite.google.com/app/apikey',
  },
};

// Optional but recommended variables
const optionalVars = {
  PORT: {
    description: 'Server port',
    example: '5001',
    default: '5001',
  },

  NODE_ENV: {
    description: 'Environment mode',
    example: 'development',
    default: 'development',
  },

  CLIENT_URL: {
    description: 'Frontend URL for CORS',
    example: 'http://localhost:5173',
    default: 'http://localhost:5173',
  },

  GOOGLE_CLIENT_ID: {
    description: 'Google OAuth client ID',
    example: 'your-google-client-id',
    note: 'Optional - only needed for Google OAuth login',
  },

  GOOGLE_CLIENT_SECRET: {
    description: 'Google OAuth client secret',
    example: 'your-google-client-secret',
    note: 'Optional - only needed for Google OAuth login',
  },

  PAYPAL_CLIENT_ID: {
    description: 'PayPal client ID for payments',
    example: 'your-paypal-client-id',
    note: 'Optional - mock mode works without this in development',
  },

  PAYPAL_CLIENT_SECRET: {
    description: 'PayPal client secret',
    example: 'your-paypal-client-secret',
    note: 'Optional - mock mode works without this in development',
  },
};

function checkEnvFile() {
  const envPath = path.join(__dirname, 'server', '.env');
  const envExamplePath = path.join(__dirname, 'server', '.env.example');

  console.log(`\n${colors.cyan}╔══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║        MeStory Environment Configuration Check         ║${colors.reset}`);
  console.log(`${colors.cyan}╚══════════════════════════════════════════════════════════╝${colors.reset}\n`);

  // Check if .env file exists
  if (!fs.existsSync(envPath)) {
    console.log(`${colors.red}✗ ERROR: .env file not found!${colors.reset}`);
    console.log(`\n${colors.yellow}📋 Action Required:${colors.reset}`);
    console.log(`1. Copy the example file:`);
    console.log(`   ${colors.cyan}cp server/.env.example server/.env${colors.reset}`);
    console.log(`\n2. Edit server/.env and add your actual values`);

    if (fs.existsSync(envExamplePath)) {
      console.log(`\n${colors.blue}ℹ  .env.example file exists and can be used as a template${colors.reset}`);
    }

    process.exit(1);
  }

  console.log(`${colors.green}✓ Found .env file${colors.reset}\n`);

  // Load environment variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  // Check required variables
  console.log(`${colors.cyan}━━━ Critical Environment Variables ━━━${colors.reset}\n`);

  let hasErrors = false;
  let hasWarnings = false;

  for (const [key, config] of Object.entries(requiredVars)) {
    const value = envVars[key];
    const isEmpty = !value || value === `your-${key.toLowerCase().replace(/_/g, '-')}` || value === '';

    if (isEmpty) {
      console.log(`${colors.red}✗ ${key}${colors.reset}`);
      console.log(`  ${colors.yellow}Missing or placeholder value${colors.reset}`);
      console.log(`  Description: ${config.description}`);
      console.log(`  Example: ${colors.cyan}${config.example}${colors.reset}`);
      if (config.note) {
        console.log(`  ${colors.blue}ℹ  ${config.note}${colors.reset}`);
      }
      console.log('');
      hasErrors = true;
    } else {
      console.log(`${colors.green}✓ ${key}${colors.reset}`);
      console.log(`  Value: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
      console.log('');
    }
  }

  // Check optional variables
  console.log(`${colors.cyan}━━━ Optional Environment Variables ━━━${colors.reset}\n`);

  for (const [key, config] of Object.entries(optionalVars)) {
    const value = envVars[key];
    const isEmpty = !value || value === `your-${key.toLowerCase().replace(/_/g, '-')}`;

    if (isEmpty) {
      if (config.default) {
        console.log(`${colors.yellow}⚠ ${key}${colors.reset}`);
        console.log(`  Will use default: ${colors.cyan}${config.default}${colors.reset}`);
      } else {
        console.log(`${colors.blue}ℹ  ${key}${colors.reset}`);
        console.log(`  ${config.description}`);
        if (config.note) {
          console.log(`  ${colors.yellow}${config.note}${colors.reset}`);
        }
      }
      console.log('');
      if (!config.default && config.note && !config.note.includes('Optional')) {
        hasWarnings = true;
      }
    } else {
      console.log(`${colors.green}✓ ${key}${colors.reset}`);
      console.log(`  Value: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
      console.log('');
    }
  }

  // Final summary
  console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

  if (hasErrors) {
    console.log(`${colors.red}❌ Configuration Check FAILED${colors.reset}`);
    console.log(`\n${colors.yellow}Please update your .env file with the missing values above.${colors.reset}`);
    console.log(`Then run this check again: ${colors.cyan}node check-env.js${colors.reset}\n`);
    process.exit(1);
  } else if (hasWarnings) {
    console.log(`${colors.yellow}⚠️  Configuration Check PASSED with warnings${colors.reset}`);
    console.log(`\nSome optional features may not work without the missing variables.`);
    console.log(`You can start the application with: ${colors.cyan}npm run dev${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.green}✅ Configuration Check PASSED${colors.reset}`);
    console.log(`\nAll environment variables are properly configured!`);
    console.log(`You can start the application with: ${colors.cyan}npm run dev${colors.reset}\n`);
    process.exit(0);
  }
}

// Run the check
checkEnvFile();
