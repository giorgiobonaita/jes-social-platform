#!/usr/bin/env node
// Build script for Capacitor static export — temporarily moves app/api out
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const apiDir  = path.join(__dirname, 'app', 'api');
const tmpDir  = path.join(__dirname, '.api-backup');

try {
  if (fs.existsSync(apiDir)) {
    fs.renameSync(apiDir, tmpDir);
    console.log('✓ app/api moved out');
  }
  // Clear Next.js cache so TypeScript validator doesn't reference old routes
  const nextDir = path.join(__dirname, '.next');
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('✓ .next cache cleared');
  }
  execSync('npm run build', { stdio: 'inherit', env: { ...process.env, MOBILE_BUILD: 'true' } });
} finally {
  if (fs.existsSync(tmpDir)) {
    fs.renameSync(tmpDir, apiDir);
    console.log('✓ app/api restored');
  }
}
