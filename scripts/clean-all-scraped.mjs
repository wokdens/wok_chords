import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SONGS_DIR = path.resolve(__dirname, '../src/content/songs');

const files = fs.readdirSync(SONGS_DIR).filter((f) => f.endsWith('.chopro'));
console.log(`Normalizing and cleaning all ${files.length} songs...`);

let cleanedCount = 0;

const VALID_DIRECTIVES = new Set(['title', 'artist', 'subtitle', 'key', 'tempo', 'time', 'c', 'comment', 'soc', 'eoc', 'sov', 'eov']);

for (const file of files) {
  const filePath = path.join(SONGS_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // 1. Replace non-breaking spaces & clean HTML entity artifacts
  content = content
    .replace(/\u00a0/g, ' ')
    .replace(/\u200b/g, '')
    .replace(/\\?&#x27;/g, "'")
    .replace(/\\?&#39;/g, "'")
    .replace(/\\?&#8217;/g, "'")
    .replace(/\\?&#8216;/g, "'")
    .replace(/\\?&#8211;/g, "-")
    .replace(/\\?&#8212;/g, "-")
    .replace(/\\?&#8230;/g, "...")
    .replace(/\\?&#8220;/g, '"')
    .replace(/\\?&#8221;/g, '"')
    .replace(/\\?&quot;/g, '"')
    .replace(/\\?&amp;/g, '&')
    .replace(/\\?&lt;/g, '<')
    .replace(/\\?&gt;/g, '>')
    .replace(/\\?&nbsp;/g, ' ')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"');

  // 2. Remove WordPress shortcodes like [sociallocker] ... [/sociallocker]
  content = content
    .replace(/\[\/?sociallocker[^\]]*\]/gi, '')
    .replace(/\[\/?embed[^\]]*\]/gi, '');

  // 3. Fix mismatched curly and square brackets like {foo] or [foo}
  content = content.replace(/\{([^}]+)\]/g, '[$1]');
  content = content.replace(/\[([^\]]+)\}/g, '[$1]');

  // 4. Fix backslashes in fretboard tabs or text
  content = content.replace(/\\([0-9a-zA-Z])/g, '/$1');
  content = content.replace(/\\/g, '/');

  // 5. Fix curly braces around chords or sections
  content = content
    .replace(/\{(\[[^\]]+\])\}/g, '$1')
    .replace(/\{\(([^)]+)\)\}/g, '[$1]')
    .replace(/\{(\[[^\]]+\][^}]+)\}/g, '$1')
    .replace(/\{(\[[^\]]+\])/g, '$1')
    .replace(/(\[[^\]]+\])\}/g, '$1');

  // 6. Fix broken brackets across newlines: "[\nAm]" -> "[Am]"
  content = content.replace(/\[\s*\r?\n\s*([A-Ga-g][^\]\r\n]*\])/g, '[$1');

  // 7. Fix unclosed bracket before newline: "[   \n" -> "\n"
  content = content.replace(/\[\s*\r?\n/g, '\n');

  // 8. Fix dangling unclosed brackets at end of line: "word [" -> "word"
  content = content.replace(/\[\s*$/gm, '');

  // 9. Fix unmatched [ on a line that has no ]: e.g. "foo [bar baz" -> "foo [bar] baz" or "foo bar baz"
  content = content.replace(/^([^\[\n]*?)\[([^\]\n]*)$/gm, (m, p1, p2) => {
    if (/^[A-Ga-g][a-zA-Z0-9#\/\+]*\s/.test(p2)) {
      return `${p1}[${p2.split(' ')[0]}] ${p2.split(' ').slice(1).join(' ')}`;
    }
    return `${p1}${p2}`;
  });

  // 10. Fix glued chords: "word[G]next" -> "word [G]next"
  content = content.replace(/([a-zA-Z\u0900-\u097F])\[([A-Ga-g][^\]]*)\]/g, '$1 [$2]');

  // 11. Clean stray ampersands in chord brackets: "[G & A]" -> "[G] [A]"
  content = content.replace(/\[([A-Ga-g][^\]]*)\s*&\s*([A-Ga-g][^\]]*)\]/g, '[$1] [$2]');

  // 12. Fix percentage signs in text (e.g. 99% -> 99 percent)
  content = content.replace(/(\d+)%/g, '$1 percent');

  // 13. Fix invalid directives: e.g. {No Chords} -> {c: No Chords}, {Verse 2} -> {c: Verse 2}
  content = content.replace(/\{([^{}:]+)\}/g, (match, p1) => {
    const trimmed = p1.trim();
    if (VALID_DIRECTIVES.has(trimmed.toLowerCase())) return match;
    if (trimmed.startsWith('[')) return trimmed;
    // Directives shouldn't have quotes or colons inside
    const safe = trimmed.replace(/['":]/g, ' ');
    return `{c: ${safe}}`;
  });

  // 14. Fix malformed directive colons like {c: [G] ...}
  content = content.replace(/\{c:\s*\[([^\]]+)\]\s*([^}]*)\}/g, '[$1] $2');

  // 15. Clean comma clutter
  content = content.replace(/\s*,\s*,\s*,\s*[, \t]*/g, ' ');
  content = content.replace(/,\s*,+/g, ',');

  // 16. Clean consecutive blank lines
  content = content.replace(/\n{3,}/g, '\n\n');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    cleanedCount++;
  }
}

console.log(`✓ Cleaned ${cleanedCount} files across ${files.length} total songs.`);
