import fs from 'node:fs';
import path from 'node:path';

const dir = 'src/content/songs';
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.chopro'));
const tagCounts = {};
const artistCounts = {};
let totalSongs = 0;

for (const file of files) {
  totalSongs++;
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) continue;
  const fm = m[1];
  let tags = [];
  let artist = 'Unknown';
  for (const line of fm.split('\n')) {
    const tm = line.match(/^tags:\s*(.*)$/);
    if (tm) {
      try {
        tags = JSON.parse(tm[1].trim());
      } catch {
        tags = tm[1].trim().replace(/[\[\]"']/g, '').split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    const am = line.match(/^artist:\s*(.*)$/);
    if (am) {
      artist = am[1].trim().replace(/^["']|["']$/g, '');
    }
  }

  artistCounts[artist] = (artistCounts[artist] || 0) + 1;

  for (const t of tags) {
    const cleanT = t.toLowerCase().trim();
    if (cleanT) {
      tagCounts[cleanT] = (tagCounts[cleanT] || 0) + 1;
    }
  }
}

console.log('Total Songs:', totalSongs);
console.log('Top 20 Tags:', Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 25));
console.log('Top 15 Artists:', Object.entries(artistCounts).sort((a, b) => b[1] - a[1]).slice(0, 15));
