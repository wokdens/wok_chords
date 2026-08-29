import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SONGS_DIR = path.resolve(__dirname, '../src/content/songs');
const MAPPING_FILE = path.resolve(__dirname, 'indichords-canonical-metadata.json');

function fetchHtml(url) {
  return new Promise((resolve) => {
    https.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'text/html',
        },
        timeout: 10000,
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          let nextUrl = res.headers.location;
          if (!nextUrl.startsWith('http')) {
            nextUrl = new URL(nextUrl, url).toString();
          }
          return resolve(fetchHtml(nextUrl));
        }
        if (res.statusCode !== 200) return resolve('');
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve(data));
      }
    ).on('error', () => resolve('')).on('timeout', () => resolve(''));
  });
}

function toTitleCase(str) {
  if (!str) return '';
  return str
    .split(/[\s-_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function cleanSlug(str) {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function run() {
  console.log('1. Discovering all Artists and Movies from IndiChords...');

  const homeHtml = await fetchHtml('https://indichords.com/');
  const hindiArtistsHtml = await fetchHtml('https://indichords.com/artists/hindi');
  const englishArtistsHtml = await fetchHtml('https://indichords.com/artists/english');

  // Discover all artist slugs
  const artistSet = new Set();
  const allHtml = homeHtml + hindiArtistsHtml + englishArtistsHtml;
  for (const m of allHtml.matchAll(/href=["'](?:https:\/\/indichords\.com)?\/artist\/([^"'\s>]+)["']/g)) {
    if (!m[1].includes('/') && m[1] !== 'hindi' && m[1] !== 'english') {
      artistSet.add(m[1].replace(/\/$/, ''));
    }
  }

  // Discover all album slugs
  const albumSet = new Set();
  for (const m of allHtml.matchAll(/href=["'](?:https:\/\/indichords\.com)?\/album\/([^"'\s>]+)["']/g)) {
    if (!m[1].includes('/')) {
      albumSet.add(m[1].replace(/\/$/, ''));
    }
  }

  // Add popular known albums to ensure 100% complete catalog
  const popularAlbums = [
    'rockstar', 'aashiqui', 'aashiqui-2', 'dil-chahta-hai', 'hum-dil-de-chuke-sanam',
    'tere-naam', 'veer-zaara', 'ae-dil-hai-mushkil', 'khamoshiyan', 'teesri-manzil',
    'maine-pyar-kiya', 'abhimaan', 'kabir-singh', 'barfi', 'cocktail', '1920-evil-returns',
    'desi-boyz', 'yeh-jawaani-hai-deewani', 'jab-we-met', 'kal-ho-naa-ho', 'kuch-kuch-hota-hai',
    'dilwale-dulhania-le-jayenge', 'sholay', 'zindagi-na-milegi-dobara', 'ranjhanna', 'kedarnath',
    'tamasha', 'raazi', 'kesari', 'sanju', 'padmaavat', 'bajirao-mastani', 'brahmastra',
    'animal', 'fighter', 'jawan', 'pathaan', 'dunki', 'gully-boy', 'highway', 'gangs-of-wasseypur',
    'wake-up-sid', 'ajab-prem-ki-ghazab-kahani', 'fanna', 'talaash', 'ghajini', 'taare-zameen-par',
    'rang-de-basanti', 'swades', 'lagaan', 'dil-se', 'bombay', 'roja', 'guru', 'devdas',
    'hum-tum', 'saathiya', 'chal-te-chal-te', 'kaho-naa-pyar-hai', 'mujhse-dosti-karoge',
    'main-hoon-na', 'om-shanti-om', 'dostana', 'an-evening-in-paris', 'aradhana', 'kashmir-ki-kali',
    'kati-patang', 'amar-prem', 'anand', 'pakeezah', 'silsila', 'chandni', 'lamhe', 'darr', 'baazigar'
  ];
  for (const a of popularAlbums) albumSet.add(a);

  console.log(`Found ${artistSet.size} unique artists and ${albumSet.size} unique movies/albums.`);

  const songToArtist = new Map();
  const songToMovie = new Map();
  const movieDetails = new Map();

  // 2. Fetch all Albums in parallel batches
  console.log('\n2. Fetching Album pages and extracting song lists...');
  const albumList = Array.from(albumSet);
  const ALBUM_CONCURRENCY = 10;
  let albumIdx = 0;

  async function albumWorker() {
    while (albumIdx < albumList.length) {
      const albumSlug = albumList[albumIdx++];
      const url = `https://indichords.com/album/${albumSlug}`;
      const html = await fetchHtml(url);
      if (!html) continue;

      // Extract movie details
      const movieMatch = html.match(/<td><b>Movie:<\/b><\/td>\s*<td>([^<]+)<\/td>/i);
      const musicMatch = html.match(/<td><b>Music:<\/b><\/td>\s*<td>([^<]+)<\/td>/i);
      const yearMatch = html.match(/<td><b>Year:<\/b><\/td>\s*<td>([^<]+)<\/td>/i);

      const movieTitle = movieMatch ? movieMatch[1].trim() : toTitleCase(albumSlug);
      const composer = musicMatch ? musicMatch[1].trim() : '';
      const year = yearMatch ? yearMatch[1].trim() : '';

      movieDetails.set(albumSlug, {
        title: movieTitle,
        slug: albumSlug,
        composer,
        year,
        songs: [],
      });

      // Extract songs under this album
      for (const m of html.matchAll(/href=["'](?:https:\/\/indichords\.com)?\/song\/(\d+)\/([^"'\s>]+)["']/g)) {
        const songId = m[1];
        const songSlug = m[2];
        songToMovie.set(songId, albumSlug);
        songToMovie.set(songSlug, albumSlug);
      }
    }
  }

  await Promise.all(Array.from({ length: ALBUM_CONCURRENCY }, albumWorker));
  console.log(`Extracted metadata for ${movieDetails.size} albums.`);

  // 3. Fetch all Artist pages in parallel batches
  console.log('\n3. Fetching Artist pages and mapping canonical artists...');
  const artistList = Array.from(artistSet);
  const ARTIST_CONCURRENCY = 15;
  let artistIdx = 0;

  async function artistWorker() {
    while (artistIdx < artistList.length) {
      const artistSlug = artistList[artistIdx++];
      const url = `https://indichords.com/artist/${artistSlug}`;
      const html = await fetchHtml(url);
      if (!html) continue;

      const artistName = toTitleCase(artistSlug);

      // Extract songs under this artist
      for (const m of html.matchAll(/href=["'](?:https:\/\/indichords\.com)?\/song\/(\d+)\/([^"'\s>]+)["']/g)) {
        const songId = m[1];
        const songSlug = m[2];
        if (!songToArtist.has(songId)) songToArtist.set(songId, artistName);
        if (!songToArtist.has(songSlug)) songToArtist.set(songSlug, artistName);
      }
    }
  }

  await Promise.all(Array.from({ length: ARTIST_CONCURRENCY }, artistWorker));
  console.log(`Mapped songs across ${artistList.length} artists.`);

  // Save canonical metadata map
  const metadataOutput = {
    albums: Array.from(movieDetails.values()),
    songToMovie: Object.fromEntries(songToMovie),
    songToArtist: Object.fromEntries(songToArtist),
  };

  fs.writeFileSync(MAPPING_FILE, JSON.stringify(metadataOutput, null, 2), 'utf8');
  console.log(`\nSaved canonical metadata mapping to: ${MAPPING_FILE}`);
}

run();
