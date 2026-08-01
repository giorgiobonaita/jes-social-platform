const fs = require('fs');
const path = require('path');

const root = process.cwd();

const pairs = [
  ['app/profile/[username]/page.mobile.tsx', 'app/profile/[username]/page.tsx'],
  ['app/post/[id]/page.mobile.tsx', 'app/post/[id]/page.tsx'],
];

for (const [src, dst] of pairs) {
  const srcPath = path.join(root, src);
  const dstPath = path.join(root, dst);
  if (!fs.existsSync(srcPath)) {
    console.error('MISSING SOURCE:', srcPath);
    process.exit(1);
  }
  fs.copyFileSync(srcPath, dstPath);
  console.log('Swapped:', src, '->', dst);
}

console.log('All pages swapped.');
