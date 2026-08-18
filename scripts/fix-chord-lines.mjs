import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SONGS_DIR = join(__dirname, '..', 'src', 'content', 'songs');

const CHORD_RE = /\[([A-G](#|b)?(m|Maj|maj|min|dim|aug|sus\d?|add\d?|7|9|11|13|maj7|m7|m9|mM7|m7b5|dim7|aug|6|m6|9|11|13|sus2|sus4|add9|add2|add4)?)\]/gi;

function isChordOnlyLine(line) {
  if (!line.trim()) return false;
  if (line.trim().startsWith('{')) return false;
  if (line.trim().startsWith('---')) return false;
  const stripped = line.replace(CHORD_RE, '').replace(/\s+/g, '').trim();
  return stripped.length < 2;
}

function isMetadataOrFrontmatter(line) {
  const t = line.trim();
  return t.startsWith('{') || t.startsWith('---') || t.startsWith('#') || /^\w+:\s*["']?/.test(t);
}

function fixContent(raw) {
  const lines = raw.split(/\r?\n/);
  const out = [];
  let i = 0;
  let changed = false;

  while (i < lines.length) {
    const line = lines[i];

    if (isChordOnlyLine(line)) {
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === '') {
        j++;
      }
      if (j < lines.length) {
        const nextLine = lines[j];
        if (!isChordOnlyLine(nextLine) && !isMetadataOrFrontmatter(nextLine) && nextLine.trim() !== '') {
          const chords = line.trim();
          const merged = chords + nextLine;
          out.push(merged);
          i = j + 1;
          changed = true;
          continue;
        }
      }
    }

    out.push(line);
    i++;
  }

  return { content: out.join('\n'), changed };
}

const files = readdirSync(SONGS_DIR).filter((f) => f.endsWith('.chopro'));
let fixedCount = 0;

for (const file of files) {
  const p = join(SONGS_DIR, file);
  const raw = readFileSync(p, 'utf8');
  const { content, changed } = fixContent(raw);
  if (changed) {
    writeFileSync(p, content, 'utf8');
    console.log(`  ✓ Fixed: ${file}`);
    fixedCount++;
  } else {
    console.log(`  - OK: ${file}`);
  }
}

console.log(`\nDone! Fixed ${fixedCount} of ${files.length} songs.`);
