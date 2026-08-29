import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SONGS_DIR = path.resolve(__dirname, '../src/content/songs');
const PROGRESS_FILE = path.resolve(__dirname, '.scrape-progress.json');

if (!fs.existsSync(SONGS_DIR)) {
  fs.mkdirSync(SONGS_DIR, { recursive: true });
}

function fetchUrl(url, maxRedirects = 3) {
  return new Promise((resolve, reject) => {
    if (maxRedirects < 0) return reject(new Error('Too many redirects'));
    https
      .get(
        url,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          timeout: 12000,
        },
        (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            let nextUrl = res.headers.location;
            if (!nextUrl.startsWith('http')) {
              nextUrl = new URL(nextUrl, url).toString();
            }
            return resolve(fetchUrl(nextUrl, maxRedirects - 1));
          }
          if (res.statusCode !== 200) {
            return reject(new Error(`HTTP ${res.statusCode}`));
          }
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve(data));
        }
      )
      .on('error', reject)
      .on('timeout', () => reject(new Error('Request Timeout')));
  });
}

function toTitleCase(str) {
  return str
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function cleanHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function slugify(s) {
  return s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const LANGUAGE_KEYWORDS = {
  hindi: ['laage', 'lage', 'hum', 'tum', 'mera', 'teri', 'yaad', 'pyar', 'dil', 'jaan', 'aap', 'main', 'tu', 'woh', 'yeh', 'hai', 'na', 'ki', 'ka', 'ke', 'se', 'ne', 'hoon', 'kar', 'karoon', 'shaam', 'shehar', 'mausam'],
  english: ['the', 'and', 'you', 'that', 'was', 'for', 'are', 'with', 'have', 'this', 'from', 'your', 'they', 'been', 'know', 'want', 'will', 'just', 'love', 'baby', 'night', 'day', 'heart', 'time'],
  punjabi: ['kudi', 'yaar', 'sardar', 'jatt', 'pind', 've', 'sanu', 'menu', 'tusi', 'assi', 'si', 'ee', 'aa', 'ja', 'naal', 'nal', 'pyar', 'gabru', 'desi', 'drama'],
  tamil: ['unna', 'enna', 'kanna', 'thalli', 'poda', 'amma', 'appa', 'kadhal', 'uyire', 'thozha', 'adi', 'da', 'chella', 'manam', 'kanne', 'vaadi', 'thirumbi', 'aasai'],
  bengali: ['ami', 'tumi', 'she', 'eta', 'amr', 'tomar', 'bhalobashi', 'na', 'keno', 'jibon', 'dhoka', 'prem', 'kore', 'kothay', 'ache', 'chole', 'bangla', 'gaan'],
  marathi: ['mi', 'tu', 'te', 'ti', 'majha', 'tujha', 'prem', 'sang', 'nay', 'kaay', 'jhala', 'manat', 'dhadak', 'aani', 'pan', 'gaane', 'bhav', 'marathi'],
  spanish: ['el', 'la', 'los', 'las', 'un', 'una', 'que', 'de', 'porque', 'cuando', 'donde', 'amor', 'vida', 'siempre', 'nunca', 'manana', 'corazon', 'quiero', 'eres'],
};

function detectLanguage(text) {
  const lower = text.toLowerCase();
  const scores = {};
  for (const [lang, kws] of Object.entries(LANGUAGE_KEYWORDS)) {
    scores[lang] = kws.filter((kw) => lower.includes(kw)).length;
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] >= 2 ? best[0] : 'hindi';
}

function hasChords(line) {
  return /\[([A-G](#|b)?(m|maj|min|dim|aug|sus\d?|add\d?|7|9|11|13|maj7|m7|m9)?)\]/i.test(line);
}

function parseIndichordsSong(html, url) {
  // Title
  let title = '';
  const titleTagMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleTagMatch) {
    title = cleanHtmlEntities(titleTagMatch[1])
      .replace(/\s*[-|]\s*Chords.*$/i, '')
      .replace(/\s*[-|]\s*Indichords.*$/i, '')
      .replace(/\s*Chords\s*&\s*Lyrics/i, '')
      .replace(/\|.*$/g, '')
      .trim();
  }

  const idMatch = url.match(/\/song\/(\d+)/);
  const songId = idMatch ? idMatch[1] : '';

  // Extract artist
  let artist = '';
  const metaMatch =
    html.match(/class="[^"]*song-meta[^"]*"[^>]*>([\s\S]*?)<\/(?:p|div)>/i) ||
    html.match(/<p[^>]*class="[^"]*meta[^"]*"[^>]*>([\s\S]*?)<\/p>/i);

  if (metaMatch) {
    const rawArtist = cleanHtmlEntities(metaMatch[1].replace(/<[^>]+>/g, ' ').trim());
    if (rawArtist && !/songwriting|software|music theory/i.test(rawArtist)) {
      artist = rawArtist
        .split(/[-_]+/)
        .map((s) => toTitleCase(s.trim()))
        .filter(Boolean)
        .join(' ');
    }
  }

  // If artist was not found from meta, parse from URL slug:
  // e.g. /song/2621/tera-hone-laga-hoon-atif-aslam-pritam
  if (!artist || artist === 'Unknown Artist') {
    const slugPart = url.replace(/https?:\/\/[^\/]+\/song\/\d+\/?/i, '').replace(/\/$/, '');
    const tokens = slugPart.split('-').filter(Boolean);
    if (tokens.length >= 3) {
      artist = tokens
        .slice(Math.max(1, Math.floor(tokens.length / 2)))
        .map(toTitleCase)
        .join(' ');
    }
  }

  if (!title) {
    const slugPart = url.replace(/https?:\/\/[^\/]+\/song\/\d+\/?/i, '').replace(/\/$/, '');
    title = toTitleCase(slugPart.replace(/-/g, ' '));
  }
  if (!artist) artist = 'Various Artists';

  // Clean HTML to text lines
  const cleanHtml = html
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<(?:br|hr)\s*\/?>/gi, '\n')
    .replace(/<\/(?:div|p|h[1-6]|section|article|main|li|tr|td|th|blockquote|pre|ul|ol|aside|nav|header|footer|span)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');

  const lines = cleanHtml
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l.length > 0);

  const STOP_PATTERNS = [
    /Trending.*Songs/i,
    /Related.*Songs/i,
    /Categories/i,
    /©\s*\d{4}/i,
    /IOS App|Android App/i,
    /Let the chords do the talking/i,
    /Indichords/i,
    /Songwriting software/i,
    /Online guitar tuner/i,
  ];

  const songLines = [];
  let started = false;

  for (const line of lines) {
    if (STOP_PATTERNS.some((p) => p.test(line))) {
      if (started) break;
      continue;
    }
    if (hasChords(line)) started = true;
    if (started) songLines.push(line);
  }

  if (songLines.length === 0) return null;

  // Extract first chord key
  let key = undefined;
  for (const l of songLines) {
    const m = l.match(/\[([A-G][#b]?(?:m|maj|min|7|9|sus\d?)?)\]/i);
    if (m) {
      key = m[1].replace(/(maj|min|7|9|sus\d?).*$/i, '');
      break;
    }
  }

  const lang = detectLanguage(songLines.join(' '));

  let verseCount = 0;
  const bodyLines = [];

  for (let i = 0; i < songLines.length; i++) {
    let l = songLines[i];

    // Check if line is a section label
    const sectionMatch = l.match(/^(?:\[|\{)?(verse|chorus|intro|outro|bridge|pre-chorus|hook)\s*(\d*)?(?:\]|\})?$/i);
    if (sectionMatch) {
      const type = sectionMatch[1].toLowerCase();
      if (type.includes('intro')) bodyLines.push('{c: Intro}');
      else if (type.includes('chorus') || type.includes('hook')) bodyLines.push('{c: Chorus}');
      else if (type.includes('bridge')) bodyLines.push('{c: Bridge}');
      else if (type.includes('outro')) bodyLines.push('{c: Outro}');
      else {
        verseCount++;
        bodyLines.push(`{c: Verse ${verseCount}}`);
      }
      continue;
    }

    // Fix word-sticking around chords: "hai[G]aur" -> "hai [G]aur"
    l = l.replace(/([a-zA-Z\u0900-\u097F])\[([A-Ga-g][^\]]*)\]/g, '$1 [$2]');
    // Clean comma artifacts
    l = l.replace(/\s*,\s*,\s*,\s*[, \t]*/g, ' ');
    l = l.replace(/,\s*,+/g, ',');
    l = l.replace(/[ \t]{4,}/g, '   ');

    bodyLines.push(l);
  }

  if (!bodyLines.some((l) => l.startsWith('{c:'))) {
    bodyLines.unshift('{c: Verse 1}');
  }

  const cleanFrontmatter = [
    '---',
    `title: "${title.replace(/"/g, '\\"')}"`,
    `artist: "${artist.replace(/"/g, '\\"')}"`,
    key ? `key: "${key}"` : null,
    `tags: ["${lang}"]`,
    'draft: false',
    '---',
  ].filter(Boolean).join('\n');

  const chordProDirectives = [
    `{title: ${title}}`,
    `{artist: ${artist}}`,
    key ? `{key: ${key}}` : null,
  ].filter(Boolean).join('\n');

  const choproContent = `${cleanFrontmatter}\n\n${chordProDirectives}\n\n${bodyLines.join('\n')}\n`;

  // Generate file slug
  const titleSlug = slugify(title);
  const artistSlug = slugify(artist).slice(0, 30);
  const fileName = songId ? `${titleSlug}-${artistSlug}-${songId}.chopro` : `${titleSlug}-${artistSlug}.chopro`;

  return {
    title,
    artist,
    key,
    lang,
    fileName,
    choproContent,
  };
}

async function scrapeAllSongs(options = {}) {
  const { limit = Infinity, concurrency = 8, delayMs = 60 } = options;

  console.log('🚀 Step 1: Fetching indichords.com sitemap...');
  let sitemapXml = '';
  try {
    sitemapXml = await fetchUrl('https://indichords.com/sitemap.xml');
  } catch (err) {
    console.error('Failed to fetch sitemap:', err.message);
    return;
  }

  const matches = sitemapXml.match(/<loc>(https:\/\/indichords\.com\/song\/[^<]+)<\/loc>/g) || [];
  const songUrls = matches.map((m) => m.replace(/<\/?loc>/g, '').trim());
  console.log(`Found ${songUrls.length} songs in sitemap!`);

  // Existing files in songs dir
  const existingFiles = new Set(fs.readdirSync(SONGS_DIR));

  // Load progress
  let progress = { completed: [], failed: [] };
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    } catch {
      /* ignore */
    }
  }
  const completedUrls = new Set(progress.completed);

  const toFetch = songUrls.filter((u) => !completedUrls.has(u)).slice(0, limit);
  console.log(`To download: ${toFetch.length} new songs (${completedUrls.size} already completed)...`);

  let downloadedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  let queueIdx = 0;

  async function worker(workerId) {
    while (queueIdx < toFetch.length) {
      const idx = queueIdx++;
      const url = toFetch[idx];

      try {
        const html = await fetchUrl(url);
        const parsed = parseIndichordsSong(html, url);

        if (parsed && parsed.choproContent) {
          const filePath = path.join(SONGS_DIR, parsed.fileName);
          fs.writeFileSync(filePath, parsed.choproContent, 'utf8');
          downloadedCount++;
          progress.completed.push(url);
        } else {
          skippedCount++;
        }
      } catch (err) {
        failedCount++;
        progress.failed.push({ url, error: err.message });
      }

      if ((downloadedCount + skippedCount + failedCount) % 25 === 0) {
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8');
        console.log(
          `[Progress] Downloaded: ${downloadedCount} | Skipped: ${skippedCount} | Failed: ${failedCount} | Total: ${queueIdx}/${toFetch.length}`
        );
      }

      if (delayMs > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  const workers = Array.from({ length: concurrency }, (_, i) => worker(i));
  await Promise.all(workers);

  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8');
  console.log('\n🎉 Scraping Completed!');
  console.log(`Successfully imported ${downloadedCount} new songs into ${SONGS_DIR}`);
}

// Read args
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : Infinity;

scrapeAllSongs({ limit, concurrency: 12, delayMs: 30 });
