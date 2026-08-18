import chordsheetjs from 'chordsheetjs';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SONGS_DIR = join(__dirname, '..', 'src', 'content', 'songs');

const cs = chordsheetjs?.ChordProParser ? chordsheetjs : (chordsheetjs?.default ?? chordsheetjs);
const ChordProParser = cs.ChordProParser;
const parser = new ChordProParser();

const files = readdirSync(SONGS_DIR).filter((f) => f.endsWith('.chopro'));
console.log(`Checking ${files.length} files...\n`);

for (const f of files) {
  const content = readFileSync(join(SONGS_DIR, f), 'utf8');
  const body = content.replace(/^---[\s\S]*?---\n?/, '').trim();
  try {
    parser.parse(body);
  } catch (e) {
    console.log(`❌ FAILED: ${f}`);
    console.log(`   Error: ${e.message}`);
    const badLines = [];
    body.split('\n').forEach((line, idx) => {
      if (/\[/.test(line)) {
        const problems = line.match(/\[[^\]]*\[/g) || [];
        if (problems.length) badLines.push([idx + 1, line.trim()]);
      }
      const rawBrackets = line.match(/\[/g) || [];
      const closeBrackets = line.match(/\]/g) || [];
      if (rawBrackets.length !== closeBrackets.length) badLines.push([idx + 1, `bracket mismatch ${rawBrackets.length}[ vs ${closeBrackets.length}] ` + line.trim().slice(0, 80)]);
    });
    if (badLines.length) {
      console.log('   Problematic lines:');
      badLines.forEach(([n, l]) => console.log(`     L${n}: ${l.slice(0, 150)}`));
    }
    console.log('');
  }
}
console.log('Done.');
