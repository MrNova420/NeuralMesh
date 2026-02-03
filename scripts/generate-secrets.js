#!/usr/bin/env node

/**
 * NeuralMesh Secrets Generator
 * Generates secure secrets for JWT tokens and other sensitive configurations
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate a random secret
function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('base64');
}

// Generate secrets
const secrets = {
  JWT_SECRET: generateSecret(32),
  REFRESH_SECRET: generateSecret(32),
  DATABASE_PASSWORD: generateSecret(16).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20),
  REDIS_PASSWORD: generateSecret(16).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20),
};

console.log('🔐 NeuralMesh Secrets Generator\n');
console.log('Generated secure secrets for your deployment:\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Display secrets
console.log('# Backend Secrets');
console.log(`JWT_SECRET=${secrets.JWT_SECRET}`);
console.log(`REFRESH_SECRET=${secrets.REFRESH_SECRET}\n`);

console.log('# Database');
console.log(`DATABASE_PASSWORD=${secrets.DATABASE_PASSWORD}\n`);

console.log('# Redis (Optional)');
console.log(`REDIS_PASSWORD=${secrets.REDIS_PASSWORD}\n`);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('⚠️  IMPORTANT: Add these to your backend/.env file');
console.log('📝 Run: cp backend/.env.example backend/.env');
console.log('Then update the secrets in backend/.env with the values above.\n');
