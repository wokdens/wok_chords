import fs from 'node:fs';
import path from 'node:path';

const serverAstroDir = path.resolve('dist/server/_astro');
const clientAstroDir = path.resolve('dist/client/_astro');

if (fs.existsSync(serverAstroDir)) {
  if (!fs.existsSync(clientAstroDir)) {
    fs.mkdirSync(clientAstroDir, { recursive: true });
  }

  const files = fs.readdirSync(serverAstroDir);
  for (const file of files) {
    if (file.endsWith('.css')) {
      const src = path.join(serverAstroDir, file);
      const dest = path.join(clientAstroDir, file);
      fs.copyFileSync(src, dest);
      console.log(`[postbuild] Copied CSS asset to client: ${file}`);
    }
  }
} else {
  console.log('[postbuild] No server _astro directory found, skipping CSS copy.');
}
