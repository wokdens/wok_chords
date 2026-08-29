import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SONGS_DIR = path.resolve(__dirname, '../src/content/songs');
const PROGRESS_FILE = path.resolve(__dirname, '.tabandchord-progress.json');

// Ensure output dir
if (!fs.existsSync(SONGS_DIR)) {
  fs.mkdirSync(SONGS_DIR, { recursive: true });
}

// 1. Get existing WokChords song files
const existingFiles = new Set(fs.readdirSync(SONGS_DIR).map((f) => f.replace(/\.chopro$/, '')));

// 2. Load progress
let progress = { completed: [], failed: [] };
if (fs.existsSync(PROGRESS_FILE)) {
  try {
    progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
  } catch (e) {}
}
const completedSet = new Set(progress.completed);

function saveProgress() {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// 3. Fetch TabAndChord sitemaps for Hindi posts
async function getTabAndChordSongUrls() {
  const sitemaps = [
    'https://tabandchord.com/post-sitemap.xml',
    'https://tabandchord.com/post-sitemap2.xml',
    'https://tabandchord.com/post-sitemap3.xml',
  ];

  const urls = [];
  for (const sm of sitemaps) {
    try {
      const res = await fetch(sm, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const xml = await res.text();
      const matches = Array.from(xml.matchAll(/<loc>(https:\/\/tabandchord\.com\/[^<]+)<\/loc>/g)).map((m) => m[1]);
      for (const url of matches) {
        const slug = url.split('/').filter(Boolean).pop() || '';
        // Only songs with chords (filter out pure tabs, lessons, downloads, policy pages)
        if (
          slug.includes('-chord') &&
          !slug.includes('download') &&
          !slug.includes('lesson') &&
          !slug.includes('exercise') &&
          !slug.includes('basic') &&
          !slug.includes('scale')
        ) {
          urls.push(url);
        }
      }
    } catch (e) {
      console.error('Error fetching sitemap:', sm, e.message);
    }
  }
  return Array.from(new Set(urls));
}

function cleanHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<ins[\s\S]*?<\/ins>/gi, '')
    .replace(/<div class=['"]code-block[\s\S]*?<\/div>/gi, '')
    .replace(/&amp;/g, '&')
    .replace(/&#038;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/?(p|div|h1|h2|h3|h4|h5|h6|li|ul|ol|blockquote)[^>]*>/gi, '\n')
    .replace(/<span[^>]*>/gi, '')
    .replace(/<\/span>/gi, '')
    .replace(/<\/?(strong|b|em|i|a)[^>]*>/gi, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function titleCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => {
      if (['a', 'an', 'the', 'in', 'on', 'of', 'at', 'by', 'for', 'with', 'to'].includes(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

function normalizeChordText(rawChord) {
  let c = rawChord.trim().replace(/^[\(\[\{]/, '').replace(/[\)\]\}]$/, '');
  c = c.replace(/bar$/i, '').replace(/maj$/i, 'maj').replace(/min$/i, 'm');
  // Capitalize root note
  if (c.length > 0) {
    const root = c.charAt(0).toUpperCase();
    const rest = c.slice(1);
    c = root + rest;
  }
  return c;
}

function parseSongPage(html, url) {
  // Extract title and artist from HTML header
  const titleMatch = html.match(/<h1[^>]*class=['"][^'"]*entry-title[^'"]*['"][^>]*>([\s\S]*?)<\/h1>/i) ||
                     html.match(/<title>([\s\S]*?)<\/title>/i);

  let rawTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
  rawTitle = rawTitle
    .replace(/-(guitar-)?(chords|tabs|lead|sheet|lyrics|easy|piano).*$/i, '')
    .replace(/\s+Guitar\s+Chords.*$/i, '')
    .replace(/\s+Chords.*$/i, '')
    .trim();

  // Extract main entry summary
  const contentMatch = html.match(/<div[^>]*class=['"][^'"]*(cm-entry-summary|entry-content)[^'"]*['"][^>]*>([\s\S]*?)<!-- CONTENT END/i) ||
                       html.match(/<div[^>]*class=['"][^'"]*(cm-entry-summary|entry-content)[^'"]*['"][^>]*>([\s\S]*?)<\/article>/i);

  if (!contentMatch) return null;

  const rawBodyHtml = contentMatch[2];

  // Extract metadata from body if present:
  // Song- ... Film- ... Singer- ...
  let artist = 'Bollywood';
  let film = '';
  let songName = rawTitle;

  const songLine = rawBodyHtml.match(/(?:Song|Track)\s*[:\-]\s*([^\n<]+)/i);
  if (songLine) songName = songLine[1].trim();

  const singerLine = rawBodyHtml.match(/(?:Singer|Artist|Singers)\s*[:\-]\s*([^\n<]+)/i);
  if (singerLine) artist = singerLine[1].trim();

  const filmLine = rawBodyHtml.match(/(?:Film|Movie|Album)\s*[:\-]\s*([^\n<]+)/i);
  if (filmLine) film = filmLine[1].trim();

  if (film && artist === 'Bollywood') {
    artist = film;
  } else if (film && !artist.toLowerCase().includes(film.toLowerCase())) {
    artist = `${artist} (${film})`;
  }

  // Clean HTML
  let cleaned = cleanHtml(rawBodyHtml);

  // Convert (Chord) or [Chord] to [Chord]
  cleaned = cleaned.replace(/\(([A-G][a-zA-Z0-9#\/\+]*)\)/g, (match, chord) => {
    return `[${normalizeChordText(chord)}]`;
  });

  // Convert Section markers
  cleaned = cleaned
    .replace(/^(Verse\s*\d*|Stanza\s*\d*)\s*:/gim, (m, sec) => `{c: ${titleCase(sec)}}`)
    .replace(/^(Chorus|Hook|Refrain|Mukhda)\s*:/gim, '{c: Chorus}')
    .replace(/^(Bridge|Interlude|Antara\s*\d*)\s*:/gim, (m, sec) => `{c: ${titleCase(sec)}}`)
    .replace(/^(Intro|Intro Chords)\s*:/gim, '{c: Intro}')
    .replace(/^(Outro)\s*:/gim, '{c: Outro}');

  // Remove metadata header lines from song body
  const lines = cleaned.split('\n');
  const songBodyLines = [];
  let foundChords = false;

  for (let line of lines) {
    line = line.trim();
    if (!line) {
      if (songBodyLines.length > 0 && songBodyLines[songBodyLines.length - 1] !== '') {
        songBodyLines.push('');
      }
      continue;
    }

    if (/^(Song|Film|Movie|Album|Lyrics|Music|Singer|Singers|Scale|Tempo|Key|Chords|Capo)\s*[:\-]/i.test(line)) {
      continue;
    }
    if (/^(User Also Liked|Related Posts|Also Read|Download PDF|Guitar Lesson)/i.test(line)) {
      break;
    }
    if (line.includes('http://') || line.includes('https://') || line.includes('tabandchord.com')) {
      continue;
    }

    if (line.includes('[')) foundChords = true;
    songBodyLines.push(line);
  }

  if (!foundChords || songBodyLines.length < 5) return null;

  // Detect Key
  const allChords = (cleaned.match(/\[([A-G][a-zA-Z0-9#\/\+]*)\]/g) || []).map((c) => c.slice(1, -1));
  const key = allChords.length > 0 ? allChords[0] : 'C';

  // Build Slug
  const cleanSlug = url.split('/').filter(Boolean).pop()
    .replace(/-guitar-chords.*/i, '')
    .replace(/-chords.*/i, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .toLowerCase();

  const finalSlug = `tac-${cleanSlug}`;

  // Build ChordPro file
  const chopro = `---
title: "${titleCase(songName)}"
artist: "${titleCase(artist)}"
key: "${key}"
tags: ["hindi", "bollywood"]
---

${songBodyLines.join('\n').trim()}
`;

  return { slug: finalSlug, chopro, title: songName, artist };
}

async function scrapeSong(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    if (!res.ok) {
      progress.failed.push(url);
      return false;
    }
    const html = await res.text();
    const song = parseSongPage(html, url);
    if (!song) {
      progress.failed.push(url);
      return false;
    }

    const filePath = path.join(SONGS_DIR, `${song.slug}.chopro`);
    fs.writeFileSync(filePath, song.chopro, 'utf8');
    progress.completed.push(url);
    return song;
  } catch (err) {
    progress.failed.push(url);
    return false;
  }
}

async function run() {
  console.log('Fetching all TabAndChord song candidate URLs...');
  const allUrls = await getTabAndChordSongUrls();
  console.log(`Found ${allUrls.length} candidate URLs.`);

  const pending = allUrls.filter((u) => !completedSet.has(u));
  console.log(`Pending downloads: ${pending.length}`);

  const CONCURRENCY = 10;
  let index = 0;
  let successCount = 0;

  async function worker(workerId) {
    while (index < pending.length) {
      const currentUrl = pending[index++];
      const result = await scrapeSong(currentUrl);
      if (result) {
        successCount++;
        console.log(`[Worker ${workerId}] (${index}/${pending.length}) Imported: ${result.title} (${result.artist})`);
      }
      if (index % 25 === 0) {
        saveProgress();
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1));
  await Promise.all(workers);
  saveProgress();

  console.log(`\nImport completed! Successfully imported ${successCount} new Bollywood songs.`);
}

run();
