import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SONGS_DIR = path.resolve(__dirname, '../src/content/songs');

const FM_OPEN = /^---\s*$/;
const DIRECTIVE = /^\{[^}]+\}\s*$/;
const COMMENT_HASH = /^#/;

function isBlankLine(l) {
  return l.trim() === '';
}

function isMetadataDirective(l) {
  const t = l.trim();
  if (t === '') return false;
  if (DIRECTIVE.test(t)) return true;
  if (COMMENT_HASH.test(t)) return true;
  return false;
}

function processBlock(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i += 2) {
    const a = lines[i];
    const b = lines[i + 1];
    if (b === undefined) {
      out.push(a);
    } else {
      out.push(`${a}        ${b}`);
    }
  }
  return out;
}

function processFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const origLines = raw.split(/\r?\n/);

  let inFrontmatter = false;
  let fmDone = false;
  let fmOpenCount = 0;
  const newLines = [];
  let buffer = [];

  const flushBuffer = () => {
    if (buffer.length === 0) return;
    const merged = processBlock(buffer);
    for (const m of merged) newLines.push(m);
    buffer = [];
  };

  for (let idx = 0; idx < origLines.length; idx++) {
    const line = origLines[idx];

    if (!fmDone) {
      if (FM_OPEN.test(line.trim())) {
        fmOpenCount++;
        inFrontmatter = fmOpenCount === 1;
        if (fmOpenCount === 2) {
          fmDone = true;
          inFrontmatter = false;
        }
        newLines.push(line);
        continue;
      }
      if (inFrontmatter) {
        newLines.push(line);
        continue;
      }
    }

    if (isBlankLine(line)) {
      flushBuffer();
      newLines.push(line);
      continue;
    }

    if (isMetadataDirective(line)) {
      flushBuffer();
      newLines.push(line);
      continue;
    }

    buffer.push(line);
  }

  flushBuffer();

  const out = newLines.join('\n') + (raw.endsWith('\n') ? '\n' : '');
  if (out !== raw) {
    fs.writeFileSync(filePath, out, 'utf8');
    return true;
  }
  return false;
}

const files = fs
  .readdirSync(SONGS_DIR)
  .filter((f) => f.endsWith('.chopro'));

let changed = 0;
for (const f of files) {
  const full = path.join(SONGS_DIR, f);
  if (processFile(full)) {
    changed++;
    console.log('  merged:', f);
  }
}

console.log(`\nDone. Modified ${changed} / ${files.length} songs.`);
