import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'out');

function fixHtml(filePath) {
  let content = readFileSync(filePath, 'utf8');
  // Remove the default Next.js viewport tag that appears after ours.
  // Next.js always adds width=device-width,initial-scale=1 via ViewportBoundary
  // even when export const viewport is defined. We keep only ours (with viewport-fit=cover).
  const DEFAULT_TAG = '<meta name="viewport" content="width=device-width, initial-scale=1"/>';
  if (content.includes(DEFAULT_TAG)) {
    content = content.replace(DEFAULT_TAG, '');
    writeFileSync(filePath, content, 'utf8');
    console.log('Fixed:', filePath);
  }
}

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) fixHtml(full);
  }
}

walk(OUT_DIR);
console.log('viewport fix complete');
