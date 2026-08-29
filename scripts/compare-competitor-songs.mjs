import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SONGS_DIR = path.resolve(__dirname, '../src/content/songs');

// 1. Get our existing song list
const ourFiles = fs.readdirSync(SONGS_DIR).filter((f) => f.endsWith('.chopro'));
const ourSongs = [];

for (const file of ourFiles) {
  const content = fs.readFileSync(path.join(SONGS_DIR, file), 'utf8');
  const m = content.match(/^---\n([\s\S]*?)\n---\n?/);
  let title = '';
  let artist = '';
  if (m) {
    for (const l of m[1].split('\n')) {
      const tm = l.match(/^title:\s*["']?(.*?)["']?$/);
      if (tm) title = tm[1].trim();
      const am = l.match(/^artist:\s*["']?(.*?)["']?$/);
      if (am) artist = am[1].trim();
    }
  }
  const slug = file.replace(/\.chopro$/, '');
  ourSongs.push({
    slug,
    title: title || slug,
    artist,
    normalized: (title || slug)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  });
}

function cleanSlug(s) {
  return s
    .replace(/^(\d{4}\/\d{2}\/)/, '')
    .replace(/-(guitar-)?(chords|tabs|lead|sheet|lesson|lyrics|easy|piano|song|video|capo|notes).*$/i, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTitle(t) {
  return t
    .toLowerCase()
    .replace(/\b(guitar|chords|tabs|lead|sheet|lyrics|song|video|lesson|easy|capo|scale|stump|in hindi|bollywood|fingerstyle|piano|notes|ost|unplugged|acoustic|cover|male|female|version)\b/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isJunkOrLesson(title) {
  const junk = [
    'basic parts', 'finger exercise', 'open string', 'guitar lesson', 'privacy policy',
    'terms of use', 'disclaimer', 'contact us', 'about us', 'how to play', 'chord diagram',
    'barre chord', 'strumming pattern', 'minor chord', 'major chord', 'scale chart',
    'fretboard notes', 'tuner online', 'metronome online', 'tips and tricks', 'exercises'
  ];
  const l = title.toLowerCase();
  return junk.some((j) => l.includes(j)) || title.length < 3;
}

function wordsMatch(a, b) {
  const normA = normalizeTitle(a);
  const normB = normalizeTitle(b);
  if (!normA || !normB) return false;
  if (normA === normB || normA.includes(normB) || normB.includes(normA)) return true;

  const wA = normA.split(' ').filter((w) => w.length >= 3);
  const wB = normB.split(' ').filter((w) => w.length >= 3);
  if (wA.length === 0 || wB.length === 0) return false;

  const common = wA.filter((w) => wB.includes(w));
  if (common.length >= 2) return true;
  if (common.length >= 1 && (wA.length === 1 || wB.length === 1)) {
    // Single word title match if length > 4 (e.g. "Pehchan", "Bulleya", "Channa")
    if (common[0].length >= 5) return true;
  }
  return false;
}

// 2. Fetch sitemaps
async function fetchTabAndChord() {
  const sitemaps = [
    'https://tabandchord.com/post-sitemap.xml',
    'https://tabandchord.com/post-sitemap2.xml',
    'https://tabandchord.com/post-sitemap3.xml',
  ];
  const results = [];
  for (const sm of sitemaps) {
    try {
      const res = await fetch(sm, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const xml = await res.text();
      const matches = Array.from(xml.matchAll(/<loc>(https:\/\/tabandchord\.com\/[^<]+)<\/loc>/g)).map((m) => m[1]);
      for (const url of matches) {
        const slug = url.split('/').filter(Boolean).pop() || '';
        if (slug && !slug.includes('contact') && !slug.includes('privacy') && !slug.includes('about') && !slug.includes('page')) {
          results.push({ site: 'TabAndChord', url, slug, title: cleanSlug(slug) });
        }
      }
    } catch (e) {}
  }
  return results;
}

async function fetchRewindCaps() {
  const sitemaps = [
    'https://rewindcaps.com/post-sitemap.xml',
    'https://rewindcaps.com/post-sitemap2.xml',
  ];
  const results = [];
  for (const sm of sitemaps) {
    try {
      const res = await fetch(sm, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const xml = await res.text();
      const matches = Array.from(xml.matchAll(/<loc>(https:\/\/rewindcaps\.com\/[^<]+)<\/loc>/g)).map((m) => m[1]);
      for (const url of matches) {
        const slug = url.split('/').filter(Boolean).pop() || '';
        if (slug && !slug.includes('contact') && !slug.includes('privacy') && !slug.includes('about')) {
          results.push({ site: 'RewindTabs', url, slug, title: cleanSlug(slug) });
        }
      }
    } catch (e) {}
  }
  return results;
}

async function run() {
  const [tabAndChord, rewindCaps] = await Promise.all([
    fetchTabAndChord(),
    fetchRewindCaps(),
  ]);

  const allItems = [...tabAndChord, ...rewindCaps];
  const uniqueSongs = new Map();

  for (const item of allItems) {
    if (isJunkOrLesson(item.title)) continue;
    const norm = normalizeTitle(item.title);
    if (!norm || norm.length < 3) continue;

    if (!uniqueSongs.has(norm)) {
      uniqueSongs.set(norm, {
        rawTitle: item.title,
        sites: new Set([item.site]),
        urls: [item.url],
      });
    } else {
      const existing = uniqueSongs.get(norm);
      existing.sites.add(item.site);
      existing.urls.push(item.url);
    }
  }

  const existingInWok = [];
  const trulyMissing = [];

  for (const [normKey, data] of uniqueSongs.entries()) {
    const matched = ourSongs.find((our) => wordsMatch(our.title, data.rawTitle) || wordsMatch(our.slug, data.rawTitle));
    if (matched) {
      existingInWok.push({ competitorTitle: data.rawTitle, wokChordsMatch: matched.title, sites: Array.from(data.sites) });
    } else {
      trulyMissing.push({
        title: data.rawTitle,
        normTitle: normKey,
        sites: Array.from(data.sites),
        sampleUrl: data.urls[0],
      });
    }
  }

  // Categorize missing songs into logical musical categories
  const bollywoodClassics = [];
  const modernBollywood = [];
  const indiePunjabiRegional = [];
  const international = [];

  const englishKeywords = ['love', 'you', 'my', 'heart', 'baby', 'night', 'girl', 'boy', 'world', 'rain', 'time', 'away', 'all', 'never', 'life', 'good', 'day', 'rock', 'stay', 'like', 'see'];

  for (const item of trulyMissing) {
    const words = item.normTitle.split(' ');
    const isEnglish = words.length > 1 && words.filter((w) => englishKeywords.includes(w)).length >= 2;
    if (isEnglish) {
      international.push(item);
    } else if (item.normTitle.includes('punjabi') || item.normTitle.includes('singh') || item.normTitle.includes('jass') || item.normTitle.includes('sidhu') || item.normTitle.includes('ap dhillon') || item.normTitle.includes('karan') || item.normTitle.includes('diljit') || item.normTitle.includes('prabh')) {
      indiePunjabiRegional.push(item);
    } else {
      // Bollywood check
      modernBollywood.push(item);
    }
  }

  fs.writeFileSync(
    path.join(__dirname, 'classified-missing.json'),
    JSON.stringify({
      totalAnalyzed: uniqueSongs.size,
      matchedCount: existingInWok.length,
      trulyMissingCount: trulyMissing.length,
      categories: {
        modernBollywoodCount: modernBollywood.length,
        indiePunjabiCount: indiePunjabiRegional.length,
        internationalCount: international.length,
      },
      topModernBollywood: modernBollywood.slice(0, 40),
      topIndiePunjabi: indiePunjabiRegional.slice(0, 30),
      topInternational: international.slice(0, 20),
    }, null, 2)
  );

  console.log('\n======================================================');
  console.log('       DETAILED HINDI SONGS COMPARISON AUDIT          ');
  console.log('======================================================');
  console.log(`Current WokChords Library:          ${ourSongs.length} songs`);
  console.log(`Unique Competitor Hindi/Pop Tracks: ${uniqueSongs.size} tracks`);
  console.log(`Already in WokChords:               ${existingInWok.length} tracks (~${((existingInWok.length / uniqueSongs.size) * 100).toFixed(1)}% match)`);
  console.log(`Total Genuinely Missing Songs:      ${trulyMissing.length} tracks`);
  console.log(`  ├─ Bollywood & Hindi Soundtracks: ${modernBollywood.length} tracks`);
  console.log(`  ├─ Punjabi & Indie Artists:       ${indiePunjabiRegional.length} tracks`);
  console.log(`  └─ English / Global Pop Tracks:   ${international.length} tracks`);
  console.log('======================================================\n');
}

run();
