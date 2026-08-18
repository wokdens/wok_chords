import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SLEEP = (ms) => new Promise((r) => setTimeout(r, ms));

function hasChords(line) {
  return /\[([A-G](#|b)?(m|maj|min|dim|aug|sus\d?|add\d?|7|9|11|13|maj7|m7|m9)?)\]/i.test(line);
}

function parseSongFromHtml(html, url) {
  let title = '';
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const songScope = articleMatch ? articleMatch[1] : html;

  const h1All = [];
  const h1Re = /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi;
  let h1m;
  while ((h1m = h1Re.exec(html)) !== null) {
    const text = h1m[1].replace(/<[^>]+>/g, '').trim();
    if (text) h1All.push(text);
  }
  console.log('H1s found:', h1All);

  for (const h of h1All) {
    const lower = h.toLowerCase();
    if (!/indichords/.test(lower) && !/let the chords/.test(lower)) {
      title = h;
      break;
    }
  }
  const titleTagMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const titleFromTag = titleTagMatch
    ? titleTagMatch[1]
        .replace(/\s*[-|]\s*Chords.*$/i, '')
        .replace(/\s*[-|]\s*Indichords.*$/i, '')
        .replace(/\|.*$/g, '')
        .trim()
    : '';
  if (!title && titleFromTag) title = titleFromTag;
  if (!title) title = h1All[h1All.length - 1] || '';
  console.log('Final title:', title);
  console.log('Title from tag:', titleFromTag);

  const metaMatch =
    songScope.match(/song-meta[^>]*>([\s\S]*?)<\/p>/i) ||
    songScope.match(/song-meta[^>]*>([\s\S]*?)<\/div>/i) ||
    songScope.match(/<p[^>]*class="[^"]*meta[^"]*"[^>]*>([\s\S]*?)<\/p>/i);

  let artistRaw = metaMatch ? metaMatch[1].replace(/<[^>]+>/g, ' ').trim() : '';
  console.log('Artist raw:', artistRaw);

  artistRaw = artistRaw
    .replace(/Songwriting software.*$/i, '')
    .replace(/songwriting.*$/i, '')
    .replace(/music.*$/i, '')
    .trim();

  const artistParts = artistRaw.split(/[-_]+/).map((s) => s.trim()).filter(Boolean);
  let artist = artistParts.join(', ').replace(/\s+/g, ' ');
  if (!artist || artist.length < 2) {
    const pieces = (titleFromTag || title).split(/[-–—|]+/).map((s) => s.trim()).filter(Boolean);
    if (pieces.length > 1) {
      artist = pieces.slice(1).join(', ');
    }
  }
  if (!artist) artist = 'Unknown Artist';
  console.log('Final artist:', artist);

  const idMatch = url.match(/\/song\/(\d+)/);
  const songId = idMatch ? idMatch[1] : '0';

  const fullText = html
    .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '')
    .replace(/<img[^>]*>/gi, ' ')
    .replace(/data-trae-ref="[^"]*"/gi, '')
    .replace(/data-google[^>]*?>/gi, '>')
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

  const allLines = fullText
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l.length > 0);

  console.log('Total lines:', allLines.length);
  const chordIdx = allLines.findIndex((l) => hasChords(l));
  console.log('First chord line at index:', chordIdx, allLines[chordIdx]?.slice(0, 80));

  const songLines = [];
  let capture = false;
  let chordLineCount = 0;

  const AFTER_TITLE_STOPS = new Set([
    'Trending Songs', 'Related Songs', 'Categories', 'Movies',
    'Discover more', 'Hindi song chords', 'Online guitar tuner',
    'Chord progression generator', 'Music theory tutorials',
  ]);

  const LINE_STOP = (l) => {
    if (AFTER_TITLE_STOPS.has(l)) return true;
    if (/^Trending .* Artists/i.test(l)) return true;
    if (/^All (Hindi|English)/i.test(l)) return true;
    if (/^© \d{4}/.test(l)) return true;
    if (/IOS App|Android App/.test(l)) return true;
    if (/ad-free|strumming patterns|auto-scroll/.test(l)) return true;
    if (/songwriting software/i.test(l)) return true;
    if (/^Enrolling |^Discovering |^Accessing |^Buying |^Exploring /i.test(l)) return true;
    if (/^Hiring |^Guitar maintenance /i.test(l)) return true;
    if (/^(Chords of Songs|Transpose songs|Over 3K songs|1M users)/.test(l)) return true;
    if (/^Let the chords do the talking$/i.test(l)) return true;
    if (/^Indichords$/i.test(l) && chordLineCount > 0) return true;
    return false;
  };

  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];
    if (LINE_STOP(line)) {
      if (chordLineCount > 0) capture = false;
      continue;
    }
    const hasChord = hasChords(line);
    if (hasChord && !capture) {
      capture = true;
    }
    if (capture) {
      if (hasChord) chordLineCount++;
      songLines.push(line);
    }
  }

  let finalLines = [];
  for (const l of songLines) {
    let normalized = l.replace(/\s{2,}/g, ' ');
    normalized = normalized
      .replace(/\s+\[([^\]]+)\]\s+/g, (m, chord) => `[${chord.trim()}]`)
      .replace(/([^\s])\s+\[([^\]]+)\]/g, '$1[$2]')
      .replace(/\[([^\]]+)\]\s+([^\s])/g, '[$1]$2')
      .replace(/\s+\[([^\]]+)\]/g, '[$1]')
      .replace(/\[([^\]]+)\]\s+/g, '[$1]')
      .replace(/\s{2,}/g, ' ')
      .trim();
    if (normalized.length < 2) {
      if (finalLines.length > 0 && finalLines[finalLines.length - 1] !== '') finalLines.push('');
      continue;
    }
    finalLines.push(normalized);
  }
  while (finalLines[0] === '') finalLines.shift();
  while (finalLines[finalLines.length - 1] === '') finalLines.pop();

  console.log('Chord line count:', chordLineCount);
  console.log('Final lines (first 15):');
  finalLines.slice(0, 15).forEach((l, i) => console.log('  ', String(i).padStart(2, '0'), l.slice(0, 100)));
  console.log('... total finalLines:', finalLines.length);
  return { id: songId, title, artist, finalLines, chordLineCount };
}

const TEST_URL = 'https://indichords.com/song/2986/zamaana-lage-arijit-singh-pritam';

async function main() {
  console.log('Fetching test URL:', TEST_URL);
  const res = await fetch(TEST_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  });
  console.log('Status:', res.status);
  const html = await res.text();
  const parsed = parseSongFromHtml(html, TEST_URL);
  console.log('\n=== Parsing summary ===');
  console.log('Title:', parsed.title);
  console.log('Artist:', parsed.artist);
  console.log('Valid:', parsed.chordLineCount >= 2);
}

main().catch((e) => console.error('FAILED:', e));
