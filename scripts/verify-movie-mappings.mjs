import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SONGS_DIR = path.resolve(__dirname, '../src/content/songs');

const files = fs.readdirSync(SONGS_DIR).filter((f) => f.endsWith('.chopro'));
const movieMap = new Map();

for (const file of files) {
  const content = fs.readFileSync(path.join(SONGS_DIR, file), 'utf8');
  const mm = content.match(/^movie:\s*["']?(.*?)["']?$/m);
  const mslug = content.match(/^movieSlug:\s*["']?(.*?)["']?$/m);
  const tm = content.match(/^title:\s*["']?(.*?)["']?$/m);
  const am = content.match(/^artist:\s*["']?(.*?)["']?$/m);

  if (mm && mm[1]) {
    const movie = mm[1].trim();
    const slug = mslug ? mslug[1].trim() : movie.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (!movieMap.has(slug)) {
      movieMap.set(slug, { title: movie, slug, songs: [] });
    }
    movieMap.get(slug).songs.push({ title: tm ? tm[1] : file, artist: am ? am[1] : '' });
  }
}

console.log(`Total Movies Mapped: ${movieMap.size}`);

const popularTest = ['rockstar', 'aashiqui-2', 'cocktail', 'barfi', '1920-evil-returns', 'desi-boyz', 'yeh-jawaani-hai-deewani', 'kabir-singh', 'dil-chahta-hai', 'hum-dil-de-chuke-sanam'];

for (const p of popularTest) {
  const m = movieMap.get(p);
  if (m) {
    console.log(`\n🎬 Movie: ${m.title} (${p}) - ${m.songs.length} songs:`);
    m.songs.forEach(s => console.log(`   - ${s.title} (${s.artist})`));
  } else {
    console.log(`\n❌ Movie ${p} NOT FOUND`);
  }
}
