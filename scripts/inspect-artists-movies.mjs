import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SONGS_DIR = path.resolve(__dirname, '../src/content/songs');

const files = fs.readdirSync(SONGS_DIR).filter((f) => f.endsWith('.chopro'));
console.log(`Total song files: ${files.length}`);

const languageCounts = {};
const hindiArtists = new Map();
const englishArtists = new Map();
const movieCounts = new Map();

for (const file of files) {
  const content = fs.readFileSync(path.join(SONGS_DIR, file), 'utf8');
  const fm = content.match(/^---\n([\s\S]*?)\n---\n?/);
  let title = '';
  let artist = '';
  let tags = [];

  if (fm) {
    for (const l of fm[1].split('\n')) {
      const tm = l.match(/^title:\s*["']?(.*?)["']?$/);
      if (tm) title = tm[1].trim();
      const am = l.match(/^artist:\s*["']?(.*?)["']?$/);
      if (am) artist = am[1].trim();
      const tagm = l.match(/^tags:\s*(.*)$/);
      if (tagm) {
        try { tags = JSON.parse(tagm[1]); } catch {
          tags = tagm[1].replace(/[\[\]"']/g, '').split(',').map(s => s.trim());
        }
      }
    }
  }

  // Detect language
  const isEnglish = tags.includes('english') || (!tags.includes('hindi') && !tags.includes('punjabi') && !tags.includes('tamil') && !tags.includes('bengali') && !tags.includes('marathi') && !tags.includes('spanish') && tags.includes('rock'));
  const isHindi = tags.includes('hindi') || tags.includes('bollywood');

  for (const t of tags) {
    languageCounts[t] = (languageCounts[t] || 0) + 1;
  }

  // Extract movie if artist has (Movie) or from title/slug
  let movie = null;
  const movieParen = artist.match(/\(([^)]+)\)$/);
  if (movieParen) {
    movie = movieParen[1].trim();
    artist = artist.replace(/\s*\([^)]+\)$/, '').trim();
  }

  if (movie) {
    movieCounts.set(movie, (movieCounts.get(movie) || 0) + 1);
  }

  // Categorize artist
  if (isEnglish && !isHindi) {
    if (artist && artist !== 'Unknown Artist') {
      englishArtists.set(artist, (englishArtists.get(artist) || 0) + 1);
    }
  } else if (isHindi) {
    if (artist && artist !== 'Bollywood' && artist !== 'Unknown Artist') {
      hindiArtists.set(artist, (hindiArtists.get(artist) || 0) + 1);
    }
  }
}

console.log('\nLanguages in library:', languageCounts);

const topHindi = Array.from(hindiArtists.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20);
console.log('\nTop 20 Hindi Artists:', topHindi);

const topEnglish = Array.from(englishArtists.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20);
console.log('\nTop 20 English Artists:', topEnglish);

const topMovies = Array.from(movieCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20);
console.log('\nTop 20 Movies:', topMovies);
