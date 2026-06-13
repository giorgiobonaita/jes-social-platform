#!/usr/bin/env node
// Build script for Capacitor static export
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const apiDir     = path.join(__dirname, 'app', 'api');
const apiTmp     = path.join(__dirname, '.api-backup');
const profileDir = path.join(__dirname, 'app', 'profile', '[username]');
const profileTmp = path.join(__dirname, '.profile-backup');

try {
  if (fs.existsSync(apiDir))     { fs.renameSync(apiDir, apiTmp);         console.log('✓ app/api moved out'); }
  if (fs.existsSync(profileDir)) { fs.renameSync(profileDir, profileTmp); console.log('✓ profile/[username] moved out'); }

  const nextDir = path.join(__dirname, '.next');
  if (fs.existsSync(nextDir)) { fs.rmSync(nextDir, { recursive: true, force: true }); console.log('✓ .next cache cleared'); }

  execSync('npm run build', { stdio: 'inherit', env: { ...process.env, MOBILE_BUILD: 'true' } });
} finally {
  if (fs.existsSync(apiTmp))     { fs.renameSync(apiTmp, apiDir);         console.log('✓ app/api restored'); }
  if (fs.existsSync(profileTmp)) { fs.renameSync(profileTmp, profileDir); console.log('✓ profile/[username] restored'); }
}
