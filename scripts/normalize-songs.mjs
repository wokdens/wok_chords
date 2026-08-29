import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SONGS_DIR = path.resolve(__dirname, '../src/content/songs');

function cleanLyricsLine(line) {
  if (line.trim().startsWith('{') || line.trim().startsWith('---') || line.trim().startsWith('#')) {
    return line;
  }

  let l = line;

  // 1. Remove scraper comma artifacts like ", , , , , ," or ",,,,,"
  l = l.replace(/\s*,\s*,\s*,\s*[, \t]*/g, ' ');
  l = l.replace(/,\s*,+/g, ',');

  // 2. Fix words stuck before chords: e.g. "hai[G]" -> "hai [G]"
  l = l.replace(/([a-zA-Z\u0900-\u097F])\[([A-Ga-g][^\]]*)\]/g, '$1 [$2]');

  // 3. Fix glued words before/after chord: e.g. "hai[G]aur" -> "hai [G]aur"
  // Note: if there is no space between closing bracket and next word, e.g. "[G]aur" vs "[G] aur", ChordPro renders chord right over the word.
  // But if a previous word was attached, rule 2 already added space before '['.

  // 4. Clean excessive spacing (keep max 3 spaces between phrases)
  l = l.replace(/[ \t]{4,}/g, '   ');

  // Remove trailing whitespace
  l = l.replace(/\s+$/, '');

  return l;
}

function normalizeSongContent(raw) {
  const parts = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!parts) return raw;

  const [, frontmatter, body] = parts;
  const bodyLines = body.split(/\r?\n/);

  // Normalize sections
  let verseCounter = 1;
  let hasChorus = false;
  let sectionIndex = 0;

  const cleanedBodyLines = [];

  for (let i = 0; i < bodyLines.length; i++) {
    let line = bodyLines[i];

    // Detect section directives
    const sectionMatch = line.match(/^\{(?:c|comment|section):\s*(.*?)\}\s*$/i);
    if (sectionMatch) {
      sectionIndex++;
      const currentLabel = sectionMatch[1].trim();

      let newLabel = currentLabel;
      if (/^verse\s*1$/i.test(currentLabel)) {
        if (sectionIndex === 1) {
          newLabel = 'Verse 1';
        } else if (sectionIndex === 2 && !hasChorus) {
          newLabel = 'Chorus';
          hasChorus = true;
        } else if (sectionIndex === 3) {
          verseCounter = 2;
          newLabel = 'Verse 2';
        } else if (sectionIndex === 4 && hasChorus) {
          newLabel = 'Chorus';
        } else if (sectionIndex === 5) {
          verseCounter = 3;
          newLabel = 'Verse 3';
        } else if (sectionIndex === 6 && hasChorus) {
          newLabel = 'Chorus';
        } else {
          verseCounter++;
          newLabel = `Verse ${verseCounter}`;
        }
      }

      cleanedBodyLines.push(`{c: ${newLabel}}`);
      continue;
    }

    cleanedBodyLines.push(cleanLyricsLine(line));
  }

  // Remove excessive consecutive blank lines in body
  const finalBodyLines = [];
  let prevBlank = false;
  for (const line of cleanedBodyLines) {
    const isBlank = line.trim() === '';
    if (isBlank && prevBlank) continue;
    finalBodyLines.push(line);
    prevBlank = isBlank;
  }

  // Ensure clean frontmatter
  const cleanFm = frontmatter.trim();
  return `---\n${cleanFm}\n---\n\n${finalBodyLines.join('\n').trim()}\n`;
}

export function processAllSongs() {
  const files = fs.readdirSync(SONGS_DIR).filter((f) => f.endsWith('.chopro'));
  let modified = 0;

  for (const file of files) {
    const filePath = path.join(SONGS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const normalized = normalizeSongContent(content);

    if (normalized !== content) {
      fs.writeFileSync(filePath, normalized, 'utf8');
      modified++;
    }
  }

  console.log(`Cleaned & Normalized ${modified} of ${files.length} songs.`);
}

processAllSongs();
