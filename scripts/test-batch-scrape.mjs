import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(fetchUrl(res.headers.location));
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Status ${res.statusCode} for ${url}`));
        }
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
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
    title = titleTagMatch[1]
      .replace(/\s*[-|]\s*Chords.*$/i, '')
      .replace(/\s*[-|]\s*Indichords.*$/i, '')
      .replace(/\|.*$/g, '')
      .trim();
  }

  // Artist from meta or h1
  let artist = 'Unknown Artist';
  const metaMatch = html.match(/class="[^"]*song-meta[^"]*"[^>]*>([\s\S]*?)<\/(?:p|div)>/i) ||
                    html.match(/<p[^>]*class="[^"]*meta[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
  if (metaMatch) {
    const rawArtist = metaMatch[1].replace(/<[^>]+>/g, ' ').trim();
    if (rawArtist && !/songwriting|software|music theory/i.test(rawArtist)) {
      artist = rawArtist.split(/[-_]+/).map((s) => s.trim()).filter(Boolean).join(' ');
    }
  }

  // If artist is still unknown, try extracting from URL slug: e.g. /song/2621/tera-hone-laga-hoon-atif-aslam-pritam
  if (artist === 'Unknown Artist') {
    const slugPart = url.replace(/https?:\/\/[^\/]+\/song\/\d+\/?/i, '').replace(/\/$/, '');
    const tokens = slugPart.split('-').filter(Boolean);
    if (tokens.length >= 3) {
      // rough title/artist separation
      artist = tokens.slice(Math.max(1, Math.floor(tokens.length / 2))).join(' ');
    }
  }

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

    if (hasChords(line)) {
      started = true;
    }

    if (started) {
      songLines.push(line);
    }
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

  // Format into clean ChordPro
  const lang = detectLanguage(songLines.join(' '));

  let sectionCount = 0;
  let verseCount = 0;
  let hasChorus = false;

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

  // If no sections were present, add default Verse 1
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

  return {
    title,
    artist,
    key,
    lang,
    choproContent,
  };
}

async function testSample() {
  console.log('Testing extraction on 3 sample songs from indichords...');
  const testUrls = [
    'https://indichords.com/song/2621/tera-hone-laga-hoon-atif-aslam-pritam',
    'https://indichords.com/song/2052/conversations-in-the-dark-john-legend',
    'https://indichords.com/song/2300/koi-na-koi-chahiye-vinod-rathod',
  ];

  for (const url of testUrls) {
    try {
      console.log(`\nFetching: ${url}`);
      const html = await fetchUrl(url);
      const parsed = parseIndichordsSong(html, url);
      if (parsed) {
        console.log(`✓ Title: ${parsed.title} | Artist: ${parsed.artist} | Key: ${parsed.key} | Lang: ${parsed.lang}`);
        console.log('Preview first 4 lines:');
        console.log(parsed.choproContent.split('\n').slice(0, 16).join('\n'));
      } else {
        console.log('❌ Failed to parse song lines');
      }
    } catch (err) {
      console.error('Error fetching:', err.message);
    }
  }
}

testSample();
