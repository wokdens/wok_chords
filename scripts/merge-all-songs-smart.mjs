import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chordsheetjs from 'chordsheetjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SONGS_DIR = path.resolve(__dirname, '../src/content/songs');

const ChordProParser = chordsheetjs.ChordProParser || chordsheetjs.default.ChordProParser;

const DIRECTIVE = /^\{[^}]+\}\s*$/;
const COMMENT_HASH = /^#/;

function cleanLine(l) {
  return l
    .replace(/<br\s*\/?>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&quot;/gi, '"')
    .trimEnd();
}

function getVisibleLength(line) {
  // Strip ChordPro brackets [C#m] to get actual lyrics character length
  return line.replace(/\[[^\]]*\]/g, '').trim().length;
}

function mergeLinesInBlock(lines) {
  const cleaned = lines.map(cleanLine).filter((l) => l.trim().length > 0);
  if (cleaned.length <= 1) return cleaned;

  const result = [];
  let i = 0;
  while (i < cleaned.length) {
    const lineA = cleaned[i];
    const lineB = cleaned[i + 1];

    if (!lineB) {
      result.push(lineA);
      i++;
      break;
    }

    const lenA = getVisibleLength(lineA);
    const lenB = getVisibleLength(lineB);

    // If both lines are short enough to fit comfortably in 1 row (under 45 chars each or combined under 75)
    if (lenA < 42 && lenB < 42 && (lenA + lenB) < 75) {
      // Check if lineA ends in punctuation
      const endsWithPunct = /[,;:.!?]$/.test(lineA.trim());
      const sep = endsWithPunct ? '        ' : ',        ';
      result.push(`${lineA.trim()}${sep}${lineB.trim()}`);
      i += 2;
    } else {
      result.push(lineA);
      i++;
    }
  }

  return result;
}

function processSong(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);

  let inFm = false;
  let fmDone = false;
  let fmCount = 0;

  const fmHeader = [];
  const bodyLines = [];

  for (const line of lines) {
    if (!fmDone) {
      if (/^---\s*$/.test(line.trim())) {
        fmCount++;
        fmHeader.push(line);
        if (fmCount === 2) {
          fmDone = true;
          inFm = false;
        } else {
          inFm = true;
        }
        continue;
      }
      if (inFm) {
        fmHeader.push(line);
        continue;
      }
    }
    bodyLines.push(line);
  }

  // Group body into blocks by directives or blank lines
  const newBody = [];
  let buffer = [];

  const flushBuffer = () => {
    if (buffer.length > 0) {
      const merged = mergeLinesInBlock(buffer);
      for (const m of merged) newBody.push(m);
      buffer = [];
    }
  };

  for (const line of bodyLines) {
    const trimmed = line.trim();
    if (trimmed === '') {
      flushBuffer();
      newBody.push('');
      continue;
    }
    if (DIRECTIVE.test(trimmed) || COMMENT_HASH.test(trimmed)) {
      flushBuffer();
      newBody.push(cleanLine(line));
      continue;
    }
    buffer.push(line);
  }
  flushBuffer();

  const finalOutput = fmHeader.join('\n') + '\n\n' + newBody.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  return finalOutput;
}

const files = fs.readdirSync(SONGS_DIR).filter((f) => f.endsWith('.chopro'));
console.log(`Processing ${files.length} song files for 2-lines-per-row merging...`);

let modifiedCount = 0;
const parser = new ChordProParser();

for (const file of files) {
  const filePath = path.join(SONGS_DIR, file);
  const orig = fs.readFileSync(filePath, 'utf8');
  const updated = processSong(filePath);

  if (orig !== updated) {
    // Validate parse
    try {
      const bodyOnly = updated.replace(/^---[\s\S]*?---\n?/, '').trim();
      parser.parse(bodyOnly);
      fs.writeFileSync(filePath, updated, 'utf8');
      modifiedCount++;
    } catch (err) {
      console.warn(`Parse error on ${file}, skipping merge:`, err.message);
    }
  }
}

console.log(`✓ Successfully merged lines in ${modifiedCount} / ${files.length} songs.`);
