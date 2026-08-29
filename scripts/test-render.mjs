import fs from 'node:fs';
import path from 'node:path';
import chordsheetjs from 'chordsheetjs';

const ChordProParser = chordsheetjs.ChordProParser || chordsheetjs.default.ChordProParser;
const HtmlDivFormatter = chordsheetjs.HtmlDivFormatter || chordsheetjs.default.HtmlDivFormatter;

const filePath = path.resolve('src/content/songs/dil-aaj-kal-purani-jeans-k-k-883.chopro');
const rawText = fs.readFileSync(filePath, 'utf8');

console.log('Raw text length:', rawText.length);

const parser = new ChordProParser();
const normalized = rawText.replace(/^---[\s\S]*?---\n?/, '').trim();
console.log('Normalized length:', normalized.length);

try {
  const sheet = parser.parse(normalized);
  console.log('Parsed sheet:', !!sheet);
  const formatter = new HtmlDivFormatter();
  const html = formatter.format(sheet);
  console.log('Formatted HTML length:', html.length);
  console.log('HTML preview:', html.slice(0, 300));
} catch (e) {
  console.error('PARSE ERROR:', e);
}
