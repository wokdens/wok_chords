import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chordsheetjs from 'chordsheetjs';

const { ChordProParser, HtmlDivFormatter, TextFormatter } = chordsheetjs;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SONGS_DIR = path.resolve(__dirname, '../src/content/songs');

const files = fs.readdirSync(SONGS_DIR).filter((f) => f.endsWith('.chopro'));
console.log(`Testing all ${files.length} song files with ChordProParser...`);

const parser = new ChordProParser();
let passed = 0;
let failed = 0;
const errors = [];

for (const file of files) {
  const filePath = path.join(SONGS_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const normalized = content.replace(/^---[\s\S]*?---\n?/, '').trim();

  try {
    const sheet = parser.parse(normalized);
    passed++;
  } catch (err) {
    failed++;
    errors.push({ file, error: err.message });
  }
}

console.log(`Results: ${passed} PASSED, ${failed} FAILED out of ${files.length}`);
if (errors.length > 0) {
  console.log('\nTop 10 errors:');
  console.log(errors.slice(0, 10));
}
